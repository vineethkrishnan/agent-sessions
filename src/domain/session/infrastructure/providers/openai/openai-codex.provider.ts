import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SessionProviderPort } from "../../../application/ports/session-provider.port.js";
import { Session } from "../../../domain/session.model.js";
import { SessionDetail } from "../../../domain/session-detail.model.js";
import { stringifyContent, readLines } from "../../parsers/jsonl-parser.js";

export class OpenAICodexProvider implements SessionProviderPort {
  readonly name = "OpenAI";
  buildResumeArgs(sessionId: string) {
    return { command: "codex", args: ["resume", sessionId] };
  }
  private readonly sessionsDir: string;

  constructor(sessionsDir?: string) {
    this.sessionsDir =
      sessionsDir ??
      process.env.CODEX_SESSIONS_DIR ??
      path.join(os.homedir(), ".codex", "sessions");
  }

  private findFilesRecursive(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.findFilesRecursive(filePath));
      } else if (file.endsWith(".jsonl")) {
        results.push(filePath);
      }
    }
    return results;
  }

  async findAll(): Promise<Session[]> {
    const files = this.findFilesRecursive(this.sessionsDir);
    const results: Session[] = [];

    for (const filePath of files) {
      try {
        const stat = fs.statSync(filePath);
        const lines = readLines(filePath);
        if (lines.length === 0) continue;

        let preview = "(no preview)";
        const project = "Unknown";
        let messageCount = 0;

        for (const line of lines) {
          const parsedEntry = JSON.parse(line);
          if (parsedEntry.role === "user" || parsedEntry.role === "assistant") {
            messageCount++;
            if (parsedEntry.role === "user" && preview === "(no preview)") {
              preview = stringifyContent(parsedEntry.content) || "(no preview)";
            }
          }
        }

        results.push(
          new Session({
            id: path.basename(filePath, ".jsonl"),
            filePath,
            project,
            gitBranch: "",
            messageCount,
            preview,
            modifiedAt: stat.mtime,
            cwd: "",
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
          if (parsedEntry.role === "user" || parsedEntry.role === "assistant") {
            return {
              role: parsedEntry.role as "user" | "assistant",
              content: stringifyContent(parsedEntry.content),
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
