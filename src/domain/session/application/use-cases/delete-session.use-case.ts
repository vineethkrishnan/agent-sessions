import type { SessionStoragePort } from "../ports/session-storage.port.js";

export class DeleteSessionUseCase {
  constructor(private readonly storage: SessionStoragePort) {}

  async execute(filePath: string): Promise<void> {
    if (!filePath) {
      throw new Error("Session file path is required");
    }
    await this.storage.delete(filePath);
  }
}
