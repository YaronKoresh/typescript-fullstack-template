import express from "express";

import { getClientConfig } from "../site-config.js";

const router = express.Router();

router.get("/config", (_req, res): void => {
  res.json(getClientConfig()) as Record<string, any>;
});

export { router as systemController };
