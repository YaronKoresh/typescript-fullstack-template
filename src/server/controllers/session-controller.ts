import fs from "node:fs";
import os from "node:os";

import express from "express";
import multer, { type File as MulterFile } from "multer";

import { MIME_TYPE_MAP } from "../constants.js";

const router = express.Router();

const sessions: Map<any, any> = new Map();

const storage = multer.diskStorage({
  destination: function (_req, _file, cb): void {
    cb(null, os.tmpdir());
  },
  filename: function (_req, file, cb): void {
    const uniqueSuffix: string =
      Date.now() + "-" + Math.random().toString(36).substr(2, 9);

    const ext: string = MIME_TYPE_MAP[file.mimetype] || ".bin";

    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/upload-demo", upload.single("demoFile"), (req, res) => {
  const file: MulterFile = req.file as MulterFile;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (fs.existsSync(file.path)) {
    console.debug(`[Demo] File saved to temporary storage: ${file.path}`);
  }

  res.json({
    message: "File uploaded successfully (Demo Mode)",
    details: {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  });
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
