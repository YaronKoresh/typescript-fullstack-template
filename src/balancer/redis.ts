import { ChildProcess, execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { IncomingMessage } from "node:http";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const redisVersion = "v2026.2.14" as const;

const isCommandAvailable = (cmd: string): boolean => {
  try {
    const checkCmd: string =
      os.platform() === "win32" ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise(
    (
      resolve: (value: void | PromiseLike<void>) => void,
      reject: (reason?: any) => void,
    ): void => {
      https
        .get(url, (response: IncomingMessage): void | Promise<void> => {
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            return downloadFile(response.headers.location, dest)
              .then(resolve)
              .catch(reject);
          }
          if (response.statusCode !== 200) {
            reject(new Error(`Download failed: ${response.statusCode}`));
            return;
          }

          const file: fs.WriteStream = fs.createWriteStream(dest);
          response.pipe(file);
          file.on("finish", (): void => {
            if (os.platform() !== "win32") {
              try {
                fs.chmodSync(dest, 0o755);
              } catch (e) {
                reject(e);
              }
            }
            file.close();
            resolve();
          });
        })
        .on("error", (err: Error): void => {
          fs.unlink(dest, (): void => {
            void 0;
          });
          reject(err);
        });
    },
  );
};

const getDownloadUrls = (): Array<string> => {
  const baseUrl: string = `https://github.com/YaronKoresh/build-redis/releases/download/${redisVersion}`;
  const platform: NodeJS.Platform = os.platform();

  if (platform === "win32")
    return [
      `${baseUrl}/redis-server-windows.exe`,
      `${baseUrl}/redis-cli-windows.exe`,
      `${baseUrl}/msys-2.0.dll`,
    ];
  if (platform === "darwin")
    return [`${baseUrl}/redis-server-macos`, `${baseUrl}/redis-cli-macos`];
  return [`${baseUrl}/redis-server-linux`, `${baseUrl}/redis-cli-linux`];
};

const isRedisRunning = (port: number = 6379): Promise<boolean> => {
  return new Promise(
    (resolve: (value: boolean | PromiseLike<boolean>) => void): void => {
      const client: net.Socket = net.createConnection({
        port,
        host: "0.0.0.0",
      });
      client.on("connect", (): void => {
        client.end();
        resolve(true);
      });
      client.on("error", (): void => {
        resolve(false);
      });
    },
  );
};

const initRedis = async (): Promise<void> => {
  if (await isRedisRunning()) return;

  const platform: string = os.platform();

  let execPath: string = "redis-server";
  if (!isCommandAvailable(execPath)) {
    const urls: Array<string> = getDownloadUrls();
    execPath = path.join(__dirname, "..", urls[0].split("/").pop());
    for (const url of urls) {
      const pth: string = path.join(__dirname, "..", url.split("/").pop());
      await downloadFile(url, pth);
    }
  }

  const child: ChildProcess = spawn(execPath, [], {
    detached: true,
    stdio: "inherit",
    shell: platform === "win32",
  });

  child.on("error", (err: Error): void => {
    console.error("Failed to spawn Redis process:", err);
  });

  child.on("exit", (code: number, signal: NodeJS.Signals): void => {
    if (code !== 0) {
      console.error(
        `Redis process exited unexpectedly with code ${code} and signal ${signal}`,
      );
    }
  });

  child.unref();
};

export { isRedisRunning };

export default initRedis;
