import { ChildProcess, spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { Redis } from "ioredis";

import { sleep } from "../shared/general-utils.js";
import { UnbreakableProcess } from "../shared/process-utils.js";

import { BALANCER_CHILDS, BASE_PORT } from "./constants.js";
import initRedis, { isRedisRunning } from "./redis.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

let childCount: number = Number(BALANCER_CHILDS);
const basePort: number = Number(BASE_PORT);

const bootstrap = async (): Promise<void> => {
  await initRedis();
  for (let i: number = 0; i < 10; i++) {
    if (await isRedisRunning()) {
      break;
    }
    await sleep(2);
  }
  const redis = new Redis("redis://0.0.0.0:6379");

  redis.on("error", (err): void => {
    console.error("Redis Client Error:", err);
  });

  const children: Map<number, ChildProcess> = new Map<number, ChildProcess>();
  const deadWorkers: Map<number, number> = new Map<number, number>();
  const cooldownPeriod = 5000 as const;
  let currentChild: number = 0;
  let childIndex: number = 0;

  const spawnWorker = (port: number): ChildProcess => {
    const scriptPath: string = path.join(__dirname, "..", "server", "index.js");
    const child: ChildProcess = spawn(
      "node",
      [scriptPath, String(port), String(childIndex)],
      {
        detached: false,
        shell: false,
        stdio: "inherit",
      },
    );

    child.on("error", (err: Error): void => {
      console.error(`❌ Failed to spawn worker on port ${port}:`, err);
    });

    child.on("exit", (): void => {
      children.delete(port);
      deadWorkers.set(port, Date.now());
      setTimeout(
        (): boolean => deadWorkers.delete(port),
        cooldownPeriod,
      ).unref();
    });

    children.set(port, child);
    return child;
  };

  for (let i: number = 0; i < childCount; i++) {
    childIndex++;
    const newPort: number = basePort + i + 2;
    spawnWorker(newPort);
  }

  const autoScale = (): void => {
    if (deadWorkers.size > childCount * 0.5) {
      childIndex++;
      const newPort: number = basePort + ++childCount + 2;
      spawnWorker(newPort);
    }
  };

  const distribute = async (socket: net.Socket): Promise<void> => {
    const clientIp: string = socket.remoteAddress || "unknown";
    let targetPort: number = 0;
    let attempts: number = 0;

    try {
      const cachedPort = await redis.get(`session:${clientIp}`);
      if (cachedPort && !deadWorkers.has(Number(cachedPort))) {
        targetPort = Number(cachedPort);
      }
    } catch (e) {
      console.error(e);
    }

    const tryConnect = (): void => {
      if (attempts >= childCount) {
        autoScale();
        socket.destroy();
        return;
      }

      if (!targetPort || deadWorkers.has(targetPort)) {
        targetPort = basePort + (currentChild % childCount) + 1;
        currentChild++;
      }

      attempts++;

      if (deadWorkers.has(targetPort)) {
        targetPort = 0;
        return tryConnect();
      }

      const to: net.Socket = net.createConnection({
        port: targetPort,
        host: "0.0.0.0",
      });
      to.setTimeout(30000);

      to.once("error", (): void => {
        deadWorkers.set(targetPort, Date.now());
        setTimeout(
          (): boolean => deadWorkers.delete(targetPort),
          cooldownPeriod,
        ).unref();
        to.destroy();
        targetPort = 0;
        tryConnect();
      });

      to.once("timeout", (): void => {
        to.destroy();
        targetPort = 0;
        tryConnect();
      });

      to.once("connect", (): void => {
        to.setTimeout(0);
        redis
          .set(`session:${clientIp}`, targetPort, "EX", 30000)
          .catch((): void => {
            void 0;
          });
        socket.pipe(to).pipe(socket);
      });

      socket.once("error", (): net.Socket => to.destroy());
    };

    tryConnect();
  };

  const balancer: net.Server = net.createServer((socket: net.Socket): void => {
    distribute(socket).catch((err): void => {
      console.error(err);
      socket.destroy();
    });
  });

  const dashboard: http.Server<
    typeof http.IncomingMessage,
    typeof http.ServerResponse
  > = http.createServer(
    (
      req: http.IncomingMessage,
      res: http.ServerResponse<http.IncomingMessage> & {
        req: http.IncomingMessage;
      },
    ): void => {
      if (req.url === "/status") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            {
              pool: {
                total: childCount,
                active: children.size,
                dead: deadWorkers.size,
              },
              workers: Array.from(children.keys()),
              quarantine: Array.from(deadWorkers.keys()),
            },
            null,
            2,
          ),
        );
        return;
      }
      res.writeHead(404).end();
    },
  );

  await Promise.all([
    new Promise<void>(
      (
        res: (value: void | PromiseLike<void>) => void,
        rej: (reason?: any) => void,
      ): void => {
        balancer.listen(basePort, "localhost", (): void => res());
        balancer.on("error", rej);
      },
    ),
    new Promise<void>(
      (res: (value: void | PromiseLike<void>) => void): void => {
        dashboard.listen(basePort + 1, "localhost", (): void => res());
      },
    ),
  ]);

  UnbreakableProcess(balancer, Array.from(children.values()));
};

bootstrap().catch((err): void => {
  console.error(err);
  process.exit(1);
});
