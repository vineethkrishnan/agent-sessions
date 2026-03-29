import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SessionProviderPort } from "../../../application/ports/session-provider.port.js";
import { Session } from "../../../domain/session.model.js";
import { SessionDetail } from "../../../domain/session-detail.model.js";
import { stringifyContent, readLines } from "../../parsers/jsonl-parser.js";

export class CursorSessionProvider implements SessionProviderPort {
  readonly name = "Cursor";
  buildResumeArgs(sessionId: string) {
    return { command: "agent", args: ["--resume", sessionId] };
  }
  private readonly sessionsDir: string;

  constructor(sessionsDir?: string) {
    this.sessionsDir =
      sessionsDir ??
      process.env.CURSOR_SESSIONS_DIR ??
      path.join(os.homedir(), ".cursor-agent", "sessions");
  }

  async findAll(): Promise<Session[]> {
    if (!fs.existsSync(this.sessionsDir)) return [];

    const results: Session[] = [];
    const files = fs
      .readdirSync(this.sessionsDir)
      .filter((fileName) => fileName.endsWith(".jsonl"));

    for (const file of files) {
      const filePath = path.join(this.sessionsDir, file);
      try {
        const stat = fs.statSync(filePath);
        const lines = readLines(filePath);
        if (lines.length === 0) continue;

        let preview = "(no preview)";
        const project = "Unknown";
        const gitBranch = "";
        const cwd = "";
        let messageCount = 0;

        for (const line of lines) {
          const parsedEntry = JSON.parse(line);
          if (parsedEntry.type === "user" || parsedEntry.type === "assistant") {
            messageCount++;
            if (parsedEntry.type === "user" && preview === "(no preview)") {
              preview = stringifyContent(parsedEntry.message?.content) || "(no preview)";
            }
          }
        }

        results.push(
          new Session({
            id: path.basename(file, ".jsonl"),
            filePath,
            project,
            gitBranch,
            messageCount,
            preview,
            modifiedAt: stat.mtime,
            cwd,
            provider: this.name,
          }),
        );
      } catch {
        continue;
      }
    }

    return results;
  }

  async getDetail(filePath: string): Promise<SessionDetail> {
    try {
      const lines = readLines(filePath);
      const messages = lines
        .map((line) => {
          const parsedEntry = JSON.parse(line);
          if (parsedEntry.type === "user" || parsedEntry.type === "assistant") {
            return {
              role: parsedEntry.type as "user" | "assistant",
              content: stringifyContent(parsedEntry.message?.content),
            };
          }
          return null;
        })
        .filter((msg): msg is { role: "user" | "assistant"; content: string } => msg !== null);

      return new SessionDetail({
        messages,
        totalMessages: messages.length,
        cwd: "",
        gitBranch: "",
      });
    } catch {
      return new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" });
    }
  }
}
