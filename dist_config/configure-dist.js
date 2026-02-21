import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPack = path.join(__dirname, "package.dist.json");
const destPack = path.join(__dirname, "..", "dist", "package.json");
fs.copyFileSync(srcPack, destPack);

const result = spawnSync("npm", ["install"], {
  encoding: "utf8",
  cwd: path.join(__dirname, "..", "dist"),
  shell: true,
  stdio: "inherit",
});

if (result.error) {
  console.error("Failed to start process:", result.error);
} else {
  console.log("Exit Code:", result.status);
  console.log("Output:", result.stdout);
}
