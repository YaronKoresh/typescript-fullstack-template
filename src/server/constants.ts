import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_DIR = path.join(__dirname, "..", "client");

const UPLOAD_LIMIT_MB = 10 as const;

const MIME_TYPE_MAP: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

export { HTML_DIR, UPLOAD_LIMIT_MB, MIME_TYPE_MAP };
