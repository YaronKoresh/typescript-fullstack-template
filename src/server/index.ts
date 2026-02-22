import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import { DOMMatrix, DOMPoint, DOMRect } from "geometry-interfaces";
import helmet from "helmet";

global.DOMMatrix = DOMMatrix;
global.DOMPoint = DOMPoint;
global.DOMRect = DOMRect;

import { UnbreakableProcess } from "../shared/process-utils.js";

import { HTML_DIR } from "./constants.js";

import { sessionController } from "./controllers/session-controller.js";
import { systemController } from "./controllers/system-controller.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req): boolean => false,
});
app.use(generalLimiter);

const aiApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: "Rate limit exceeded. Please wait before sending more API requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/session/:sessionId/message", aiApiLimiter);

const sessionCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    error:
      "Too many session creation attempts. Please wait 5 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
app.use("/api/session", sessionCreationLimiter);

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many contact requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/contact", contactLimiter);

const shouldCompress = (req: express.Request, res: express.Response) => {
  if (req.headers["x-no-compression"]) {
    return false;
  }
  return compression.filter(req, res);
};

try {
  app.use(
    compression({
      level: 9,
      threshold: 512,
      filter: shouldCompress,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
            "https://fonts.googleapis.com",
          ],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://fonts.googleapis.com",
          ],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: true,
    }),
  );
} catch (err) {
  console.warn("Could not enable helmet security headers.\n" + err);
}

app.use((_req, res, next): void => {
  res.header("X-Powered-By", "Chat Engines Platform");
  res.header("X-Framework", "Express.js");
  res.header("X-Engine", "Universal Gen Engine");
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get(["/favicon.ico", "/favicon.png"], (_req, res): void => {
  res.redirect(301, "/favicon.svg");
});

app.get("/", async (req, res, next): Promise<void> => {
  const pagePath: string = path.join(HTML_DIR, "en", "index.html");

  if (fs.existsSync(pagePath)) {
    try {
      const processedHtml: string = fs.readFileSync(pagePath, "utf8");
      res.type("html").send(processedHtml);
    } catch (err) {
      const errorMessage: string =
        err instanceof Error ? err.message : "Unknown error";
      console.error("Error processing English index.html:", errorMessage);
      next(err);
    }
  } else {
    next();
  }
});

app.use(
  express.static(HTML_DIR, {
    maxAge: "0",
    etag: true,
  }),
);

app.use("/api", systemController);
app.use("/api/session", sessionController);

const port: number = parseInt(process.argv[2]);

const listener = app.listen(port, "0.0.0.0");

UnbreakableProcess(listener);
