import type { SessionDetail } from "../../domain/session-detail.model.js";
import type { SessionRepositoryPort } from "../ports/session-repository.port.js";

export class GetSessionDetailUseCase {
  constructor(private readonly repository: SessionRepositoryPort) {}

  async execute(filePath: string, providerName?: string): Promise<SessionDetail> {
    return this.repository.getDetail(filePath, providerName);
  }
}
