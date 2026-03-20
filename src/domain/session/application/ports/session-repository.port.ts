import type { Session } from "../../domain/session.model.js";

export interface SessionRepositoryPort {
  findAll(): Session[];
}
