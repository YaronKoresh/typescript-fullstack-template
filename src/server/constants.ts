import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_DIR = path.join(__dirname, "..", "client");

const UPLOAD_LIMIT_MB = 10 as const;

export { HTML_DIR, UPLOAD_LIMIT_MB };
