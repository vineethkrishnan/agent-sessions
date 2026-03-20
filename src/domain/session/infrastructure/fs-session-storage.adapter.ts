import fs from "node:fs";
import type { SessionStoragePort } from "../application/ports/session-storage.port.js";

export class FsSessionStorageAdapter implements SessionStoragePort {
  delete(filePath: string): void {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File may already be deleted
    }

    const companionDir = filePath.replace(/\.jsonl$/, "");
    try {
      fs.rmSync(companionDir, { recursive: true });
    } catch {
      // Directory may not exist
    }
  }
}
