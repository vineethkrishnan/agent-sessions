import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SessionProviderPort } from "../../../application/ports/session-provider.port.js";
import { Session } from "../../../domain/session.model.js";
import { SessionDetail } from "../../../domain/session-detail.model.js";
import { stringifyContent } from "../../parsers/jsonl-parser.js";

export class GeminiSessionProvider implements SessionProviderPort {
  readonly name = "Gemini";
  buildResumeArgs(sessionId: string) {
    return { command: "gemini", args: ["--resume", sessionId] };
  }
  private readonly tmpDir: string;

  constructor(tmpDir?: string) {
    this.tmpDir = tmpDir ?? process.env.GEMINI_TMP_DIR ?? path.join(os.homedir(), ".gemini", "tmp");
  }

  async findAll(): Promise<Session[]> {
    if (!fs.existsSync(this.tmpDir)) return [];

    const results: Session[] = [];
    const projectHashes = fs.readdirSync(this.tmpDir).filter((dirEntry) => {
      try {
        return fs.statSync(path.join(this.tmpDir, dirEntry)).isDirectory();
      } catch {
        return false;
      }
    });

    for (const hash of projectHashes) {
      const chatsDir = path.join(this.tmpDir, hash, "chats");
      if (!fs.existsSync(chatsDir)) continue;

      const chatFiles = fs.readdirSync(chatsDir).filter((fileName) => fileName.endsWith(".json"));
      for (const file of chatFiles) {
        const filePath = path.join(chatsDir, file);
        try {
          const stat = fs.statSync(filePath);
          const chatPayload = JSON.parse(fs.readFileSync(filePath, "utf-8"));

          const chatMessages = (chatPayload.messages || []).filter(
            (m: { type?: string }) => m.type === "user" || m.type === "gemini",
          );
          const firstUserMessage = chatMessages.find((m: { type: string }) => m.type === "user");

          results.push(
            new Session({
              id: path.basename(file, ".json"),
              filePath,
              project: chatPayload.project || "Unknown",
              gitBranch: chatPayload.gitBranch || "",
              messageCount: chatMessages.length,
              preview: stringifyContent(firstUserMessage?.content) || "(no preview)",
              modifiedAt: stat.mtime,
              cwd: chatPayload.cwd || "",
              provider: this.name,
            }),
          );
        } catch {
          continue;
        }
      }
    }

    return results;
  }

  async getDetail(filePath: string): Promise<SessionDetail> {
    try {
      const chatPayload = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const messages = (chatPayload.messages || [])
        .filter(
          (message: { type?: string }) => message.type === "user" || message.type === "gemini",
        )
        .map((message: { type: string; content?: unknown }) => ({
          role: message.type === "user" ? ("user" as const) : ("assistant" as const),
          content: stringifyContent(message.content),
        }));

      return new SessionDetail({
        messages,
        totalMessages: messages.length,
        cwd: chatPayload.cwd || "",
        gitBranch: chatPayload.gitBranch || "",
      });
    } catch {
      return new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" });
    }
  }
}
