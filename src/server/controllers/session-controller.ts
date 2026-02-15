import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import express from "express";
import multer, { type File as MulterFile } from "multer";

const router = express.Router();

const sessions: Map<any, any> = new Map();

const storage = multer.diskStorage({
  destination: function (_req, _file, cb): void {
    cb(null, os.tmpdir());
  },
  filename: function (_req, file, cb): void {
    const uniqueSuffix: string =
      Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

setInterval((): void => {
  const oneHourAgo: number = Date.now() - 3600000;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      sessions.delete(sessionId);
    }
  }
}, 300000);

export { router as sessionController };
