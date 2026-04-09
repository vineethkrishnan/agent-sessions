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

  private parseSessionSummary(lines: string[]): {
    cwd: string;
    gitBranch: string;
    project: string;
    messageCount: number;
    preview: string;
  } {
    let cwd = "";
    let gitBranch = "";
    let project = "";
    let messageCount = 0;
    let preview = "(no preview)";

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.cwd && !cwd) cwd = entry.cwd;
        if (entry.gitBranch && !gitBranch) gitBranch = entry.gitBranch;
        if (entry.project && !project) project = entry.project;
        if (entry.role === "user" || entry.role === "assistant") {
          messageCount++;
          if (entry.role === "user" && preview === "(no preview)") {
            preview = stringifyContent(entry.content) || "(no preview)";
          }
        }
      } catch {
        continue;
      }
    }

    return { cwd, gitBranch, project: project || "Unknown", messageCount, preview };
  }

  async findAll(): Promise<Session[]> {
    const files = this.findFilesRecursive(this.sessionsDir);

    const sessions = await Promise.all(
      files.map(async (filePath) => {
        try {
          const stat = fs.statSync(filePath);
          const lines = readLines(filePath);
          if (lines.length === 0) return null;

          const summary = this.parseSessionSummary(lines);

          return new Session({
            id: path.basename(filePath, ".jsonl"),
            filePath,
            project: summary.project,
            gitBranch: summary.gitBranch,
            messageCount: summary.messageCount,
            preview: summary.preview,
            modifiedAt: stat.mtime,
            cwd: summary.cwd,
            provider: this.name,
          });
        } catch {
          return null;
        }
      }),
    );

    return sessions.filter((s): s is Session => s !== null);
  }

  async getDetail(filePath: string): Promise<SessionDetail> {
    try {
      const lines = readLines(filePath);
      const metadata = this.parseSessionSummary(lines);

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
        cwd: metadata.cwd,
        gitBranch: metadata.gitBranch,
      });
    } catch {
      return new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" });
    }
  }
}
