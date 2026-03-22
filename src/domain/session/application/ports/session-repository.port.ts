import type { Session } from "../../domain/session.model.js";
import type { SessionDetail } from "../../domain/session-detail.model.js";

export interface SessionRepositoryPort {
  findAll(): Session[];
  getDetail(filePath: string): SessionDetail;
}
