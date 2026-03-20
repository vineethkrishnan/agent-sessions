import type { Session } from "../domain/session.model.js";
import { SessionNotFoundError } from "../domain/session.error.js";
import type { SessionStoragePort } from "./ports/session-storage.port.js";

export class DeleteSessionUseCase {
  constructor(private readonly storage: SessionStoragePort) {}

  execute(session: Session): void {
    if (!session.filePath) {
      throw new SessionNotFoundError(session.id);
    }
    this.storage.delete(session.filePath);
  }
}
