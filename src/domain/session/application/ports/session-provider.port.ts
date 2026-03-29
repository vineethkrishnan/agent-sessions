import type { Session } from "../../domain/session.model.js";
import type { SessionDetail } from "../../domain/session-detail.model.js";

export interface SessionProviderPort {
  readonly name: string;
  buildResumeArgs(sessionId: string): { command: string; args: string[] };
  findAll(): Promise<Session[]>;
  getDetail(filePath: string): Promise<SessionDetail>;
}
