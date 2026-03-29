import fs from "node:fs/promises";
import type { SessionStoragePort } from "../../application/ports/session-storage.port.js";

export class FsSessionStorageAdapter implements SessionStoragePort {
  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    const companionDir = filePath.replace(/\.(jsonl|json)$/, "");
    try {
      await fs.rm(companionDir, { recursive: true });
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
