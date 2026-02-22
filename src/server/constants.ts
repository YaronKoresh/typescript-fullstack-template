import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const HTML_DIR: string = path.join(__dirname, "..", "client");

const UPLOAD_LIMIT_MB = 10 as const;

export { HTML_DIR, UPLOAD_LIMIT_MB };
