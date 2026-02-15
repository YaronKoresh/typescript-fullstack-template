import fs from "node:fs";
import path from "node:path";

const getMimeType = function (filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".md": "text/markdown",
    ".js": "text/javascript",
    ".ts": "text/typescript",
    ".html": "text/html",
    ".css": "text/css",
    ".csv": "text/csv",
    ".xml": "application/xml",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".py": "text/x-python",
    ".java": "text/x-java",
    ".c": "text/x-c",
    ".cpp": "text/x-c++",
    ".h": "text/x-c",
    ".rs": "text/x-rust",
    ".go": "text/x-go",
    ".rb": "text/x-ruby",
    ".php": "text/x-php",
    ".sh": "text/x-shellscript",
    ".sql": "text/x-sql",
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    ".toml": "text/x-toml",
    ".ini": "text/x-ini",
    ".env": "text/plain",
    ".log": "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

const isImageFile = function (filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
};

const isTextFile = function (filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".txt",
    ".json",
    ".md",
    ".js",
    ".ts",
    ".html",
    ".css",
    ".csv",
    ".xml",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".rs",
    ".go",
    ".rb",
    ".php",
    ".sh",
    ".sql",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".env",
    ".log",
    ".jsx",
    ".tsx",
    ".vue",
    ".svelte",
    ".scss",
    ".sass",
    ".less",
    ".graphql",
    ".prisma",
  ].includes(ext);
};

const isExcelFile = function (filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".xlsx", ".xls", ".csv"].includes(ext);
};

const isPdfFile = function (filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".pdf";
};

const isBinaryFile = function (filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".dat",
    ".zip",
    ".tar",
    ".gz",
    ".rar",
    ".7z",
    ".wasm",
    ".class",
    ".pyc",
    ".o",
    ".obj",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
  ].includes(ext);
};

const readFileAsBase64 = function (filePath: string): string {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const fileBuffer = fs.readFileSync(absolutePath);
  return fileBuffer.toString("base64");
};

const readFileAsText = function (filePath: string): string {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  return fs.readFileSync(absolutePath, "utf-8");
};

const parseAttachmentInput = function (input: string): {
  isAttachment: boolean;
  filePath: string | null;
} {
  const attachRegex: RegExp = /^@attach\s+(.+)$/i;
  const match: RegExpMatchArray = input.match(attachRegex);
  if (match) {
    return { isAttachment: true, filePath: match[1].trim() };
  }
  return { isAttachment: false, filePath: null };
};

export {
  getMimeType,
  isBinaryFile,
  isExcelFile,
  isImageFile,
  isPdfFile,
  isTextFile,
  parseAttachmentInput,
  readFileAsBase64,
  readFileAsText,
};
