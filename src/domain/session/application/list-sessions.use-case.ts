import type { Session } from "../domain/session.model.js";
import type { SessionRepositoryPort } from "./ports/session-repository.port.js";

export class ListSessionsUseCase {
  constructor(private readonly repository: SessionRepositoryPort) {}

  execute(filter?: string): Session[] {
    const sessions = this.repository.findAll();
    if (!filter) return sessions;
    return sessions.filter((s) => s.matchesFilter(filter));
  }
}
