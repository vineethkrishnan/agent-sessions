import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import type { SessionProviderPort } from "../../../application/ports/session-provider.port.js";
import { Session } from "../../../domain/session.model.js";
import { SessionDetail } from "../../../domain/session-detail.model.js";
import { stringifyContent } from "../../parsers/jsonl-parser.js";

interface CursorMeta {
  agentId: string;
  name?: string;
}

interface CursorMessage {
  role: string;
  content: unknown;
}

export class CursorSessionProvider implements SessionProviderPort {
  readonly name = "Cursor";
  buildResumeArgs(sessionId: string) {
    return { command: "cursor", args: ["--resume", sessionId] };
  }
  private readonly chatsDir: string;

  constructor(chatsDir?: string) {
    this.chatsDir = chatsDir ?? process.env.CURSOR_SESSIONS_DIR ?? this.detectChatsDir();
  }

  private detectChatsDir(): string {
    const platform = os.platform();
    const home = os.homedir();

    if (platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      const windowsPath = path.join(appData, "Cursor", "chats");
      if (fs.existsSync(windowsPath)) return windowsPath;
    }

    return path.join(home, ".cursor", "chats");
  }

  private findSessionDbs(): { dbPath: string; uuidDir: string }[] {
    if (!fs.existsSync(this.chatsDir)) return [];

    const results: { dbPath: string; uuidDir: string }[] = [];

    let hashDirs: string[];
    try {
      hashDirs = fs.readdirSync(this.chatsDir);
    } catch {
      return [];
    }

    for (const hashDir of hashDirs) {
      const hashPath = path.join(this.chatsDir, hashDir);
      try {
        if (!fs.statSync(hashPath).isDirectory()) continue;
      } catch {
        continue;
      }

      let uuidDirs: string[];
      try {
        uuidDirs = fs.readdirSync(hashPath);
      } catch {
        continue;
      }

      for (const uuidDir of uuidDirs) {
        const dbPath = path.join(hashPath, uuidDir, "store.db");
        if (fs.existsSync(dbPath)) {
          results.push({ dbPath, uuidDir });
        }
      }
    }

    return results;
  }

  private openDb(dbPath: string): InstanceType<typeof Database> | null {
    try {
      return new Database(dbPath, { readonly: true });
    } catch {
      return null;
    }
  }

  private readMeta(db: InstanceType<typeof Database>): CursorMeta | null {
    try {
      const row = db.prepare("SELECT value FROM meta").get() as { value: string } | undefined;
      if (!row) return null;
      return JSON.parse(Buffer.from(row.value, "hex").toString("utf-8"));
    } catch {
      return null;
    }
  }

  private readMessages(db: InstanceType<typeof Database>): CursorMessage[] {
    try {
      const rows = db.prepare("SELECT data FROM blobs").all() as { data: Buffer }[];
      const messages: CursorMessage[] = [];

      for (const row of rows) {
        try {
          const text =
            typeof row.data === "string" ? row.data : Buffer.from(row.data).toString("utf-8");
          if (!text.startsWith('{"')) continue;
          const parsed = JSON.parse(text);
          if (parsed.role === "user" || parsed.role === "assistant") {
            messages.push({ role: parsed.role, content: parsed.content });
          }
        } catch {
          continue;
        }
      }

      return messages;
    } catch {
      return [];
    }
  }

  async findAll(): Promise<Session[]> {
    const sessionDbs = this.findSessionDbs();
    const results: Session[] = [];

    for (const { dbPath, uuidDir } of sessionDbs) {
      const db = this.openDb(dbPath);
      if (!db) continue;

      try {
        const meta = this.readMeta(db);
        if (!meta) continue;

        const messages = this.readMessages(db);
        const cwd = this.extractCwdFromMessages(messages);
        const preview = this.extractPreviewFromMessages(messages);

        const stat = fs.statSync(dbPath);

        results.push(
          new Session({
            id: meta.agentId || uuidDir,
            filePath: dbPath,
            project: meta.name || "Unknown",
            gitBranch: "",
            messageCount: messages.length,
            preview: preview || "(no preview)",
            modifiedAt: stat.mtime,
            cwd,
            provider: this.name,
          }),
        );
      } catch {
        continue;
      } finally {
        db.close();
      }
    }

    return results;
  }

  private extractCwdFromMessages(messages: CursorMessage[]): string {
    for (const msg of messages) {
      if (msg.role !== "user") continue;
      const raw = stringifyContent(msg.content);
      const cwdMatch = raw.match(/Workspace Path:\s*(.+)/);
      if (cwdMatch) return cwdMatch[1]!.trim();
    }
    return "";
  }

  private extractPreviewFromMessages(messages: CursorMessage[]): string {
    const userMessages = messages.filter((m) => m.role === "user");
    for (const msg of userMessages) {
      const text = stringifyContent(msg.content).replace(/\s+/g, " ").trim();
      const queryMatch = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
      if (queryMatch) return queryMatch[1]!.trim().slice(0, 80);
      if (text.startsWith("<")) continue;
      return text.slice(0, 80);
    }
    return "(no preview)";
  }

  async getDetail(filePath: string): Promise<SessionDetail> {
    const db = this.openDb(filePath);
    if (!db) {
      return new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" });
    }

    try {
      const messages = this.readMessages(db);
      const cwd = this.extractCwdFromMessages(messages);

      const sessionMessages = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: stringifyContent(msg.content),
      }));

      return new SessionDetail({
        messages: sessionMessages,
        totalMessages: sessionMessages.length,
        cwd,
        gitBranch: "",
      });
    } catch {
      return new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" });
    } finally {
      db.close();
    }
  }
}
