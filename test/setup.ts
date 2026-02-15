import { crypto } from "node:crypto";

if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}
