import type { Session } from "../domain/session.model.js";
import type { SessionDetail } from "../domain/session-detail.model.js";
import type { SessionRepositoryPort } from "./ports/session-repository.port.js";

export class GetSessionDetailUseCase {
  constructor(private readonly repository: SessionRepositoryPort) {}

  execute(session: Session): SessionDetail {
    return this.repository.getDetail(session.filePath);
  }
}
