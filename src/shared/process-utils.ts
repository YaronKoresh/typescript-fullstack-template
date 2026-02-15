import process from "node:process";

const Terminate = function (
  server: any,
  children: any[] = [],
  code: number = 0,
  delay: number = 4000,
): void {
  const Exit = function (): void {
    if (code < 0) {
      process.abort();
    } else {
      process.exit(code);
    }
  };

  for (const child of children) {
    if (child?.kill) child.kill("SIGTERM");
  }

  if (server?.close) {
    server.close(Exit);
  } else {
    Exit();
  }

  setTimeout(Exit, delay).unref();
};

const UnbreakableProcess = function (
  listener: any,
  children: any[] = [],
): void {
  process.on("uncaughtException", (e): void => console.error("Error:", e));
  process.on("unhandledRejection", (e): void =>
    console.error("Promise Rejection:", e),
  );

  ["SIGTERM", "SIGINT"].forEach((sig: string): void => {
    process.on(sig, (): void => {
      console.log(sig);
      Terminate(listener, children);
    });
  });
};

export { UnbreakableProcess };
