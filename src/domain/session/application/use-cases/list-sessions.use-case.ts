import type { Session } from "../../domain/session.model.js";
import type { SessionRepositoryPort } from "../ports/session-repository.port.js";

export class ListSessionsUseCase {
  constructor(private readonly repository: SessionRepositoryPort) {}

  async execute(): Promise<Session[]> {
    return this.repository.findAll();
  }
}
