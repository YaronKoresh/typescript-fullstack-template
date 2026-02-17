import os from "node:os";

import express from "express";
import multer, { type File as MulterFile } from "multer";

const router = express.Router();

const uploads: Map<any, any> = new Map();

const storage = multer.diskStorage({
  destination: function (_req, _file, cb): void {
    cb(null, os.tmpdir());
  },
  filename: function (_req, file, cb): void {
    const name: string =
      Date.now() + "-" + Math.random().toString(36).substr(2, 9);

    cb(null, `${name}.uploaded_data`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 5,
  },
  fileFilter: (_req, file, cb): void => {
    cb(null, true);
  },
});

router.post("/upload-demo", upload.single("demoFile"), (req, res) => {
  const file: MulterFile = req.file as MulterFile;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  uploads.set(file.filename, {
    originalName: file.originalname,
    actualMime: file.mimetype,
    tempPath: file.path,
    createdAt: Date.now(),
  });

  res.json({
    message: "File uploaded successfully",
    details: {
      mimeType: file.mimetype,
      fileSize: file.size,
    },
  });
});

setInterval((): void => {
  const oneHourAgo: number = Date.now() - 3600000;
  for (const [fileId, fileDetails] of uploads.entries()) {
    if (fileDetails.createdAt < oneHourAgo) {
      uploads.delete(fileId);
    }
  }
}, 300000);

export { router as sessionController };
