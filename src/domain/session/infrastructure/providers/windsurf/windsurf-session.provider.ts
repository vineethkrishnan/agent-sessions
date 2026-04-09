import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SessionProviderPort } from "../../../application/ports/session-provider.port.js";
import { Session } from "../../../domain/session.model.js";
import { SessionDetail } from "../../../domain/session-detail.model.js";
import { stringifyContent } from "../../parsers/jsonl-parser.js";

interface WindsurfMessage {
  role: string;
  content: unknown;
}

interface WindsurfConversation {
  conversationId?: string;
  workspace?: string;
  cwd?: string;
  gitBranch?: string;
  title?: string;
  messages?: WindsurfMessage[];
}

export class WindsurfSessionProvider implements SessionProviderPort {
  readonly name = "Windsurf";
  buildResumeArgs(sessionId: string) {
    return { command: "windsurf", args: ["--resume", sessionId] };
  }
  private readonly sessionsDir: string;

  constructor(sessionsDir?: string) {
    this.sessionsDir = sessionsDir ?? process.env.WINDSURF_SESSIONS_DIR ?? this.detectSessionsDir();
  }

  private detectSessionsDir(): string {
    const platform = os.platform();
    const home = os.homedir();

    if (platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      return path.join(appData, "Windsurf", "User", "globalStorage", "codeium.windsurf", "cascade");
    }

    if (platform === "darwin") {
      return path.join(
        home,
        "Library",
        "Application Support",
        "Windsurf",
        "User",
        "globalStorage",
        "codeium.windsurf",
        "cascade",
      );
    }

    return path.join(
      home,
      ".config",
      "Windsurf",
      "User",
      "globalStorage",
      "codeium.windsurf",
      "cascade",
    );
  }

  private findSessionFiles(): string[] {
    if (!fs.existsSync(this.sessionsDir)) return [];

    const results: string[] = [];
    try {
      const entries = fs.readdirSync(this.sessionsDir);
      for (const entry of entries) {
        const filePath = path.join(this.sessionsDir, entry);
        try {
          if (fs.statSync(filePath).isFile() && entry.endsWith(".json")) {
            results.push(filePath);
          }
        } catch {
          continue;
        }
      }
    } catch {
      return [];
    }

    return results;
  }

  private parseConversation(filePath: string): WindsurfConversation | null {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed: unknown = JSON.parse(content);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed as WindsurfConversation;
    } catch {
      return null;
    }
  }

  private filterMessages(messages: WindsurfMessage[]): WindsurfMessage[] {
    return messages.filter((m) => m.role === "user" || m.role === "assistant");
  }

  async findAll(): Promise<Session[]> {
    const files = this.findSessionFiles();
    const results: Session[] = [];

    for (const filePath of files) {
      const conversation = this.parseConversation(filePath);
      if (!conversation) continue;

      const messages = this.filterMessages(conversation.messages || []);
      if (messages.length === 0) continue;

      const firstUser = messages.find((m) => m.role === "user");
      const preview = firstUser
        ? stringifyContent(firstUser.content).replace(/\s+/g, " ").trim().slice(0, 80)
        : "(no preview)";

      try {
        const stat = fs.statSync(filePath);
        results.push(
          new Session({
            id: conversation.conversationId || path.basename(filePath, ".json"),
            filePath,
            project: conversation.title || conversation.workspace || "Unknown",
            gitBranch: conversation.gitBranch || "",
            messageCount: messages.length,
            preview: preview || "(no preview)",
            modifiedAt: stat.mtime,
            cwd: conversation.cwd || conversation.workspace || "",
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
    const conversation = this.parseConversation(filePath);
    if (!conversation) {
      return new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" });
    }

    const messages = this.filterMessages(conversation.messages || []).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: stringifyContent(msg.content),
    }));

    return new SessionDetail({
      messages,
      totalMessages: messages.length,
      cwd: conversation.cwd || conversation.workspace || "",
      gitBranch: conversation.gitBranch || "",
    });
  }
}
