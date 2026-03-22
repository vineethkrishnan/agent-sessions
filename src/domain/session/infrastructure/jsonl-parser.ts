import fs from "node:fs";
import type { SessionMessage } from "../domain/session-detail.model.js";

export interface ParsedSessionMetadata {
  preview: string;
  gitBranch: string;
  cwd: string;
  messageCount: number;
}

export interface ParsedSessionDetail {
  messages: SessionMessage[];
  totalMessages: number;
  gitBranch: string;
  cwd: string;
}

export function extractMessageText(data: Record<string, unknown>): string {
  const messageContent = (data.message as Record<string, unknown>)?.content ?? "";

  if (typeof messageContent === "string") return messageContent;

  if (Array.isArray(messageContent)) {
    return messageContent
      .filter((block: Record<string, unknown>) => block.type === "text")
      .map((block: Record<string, unknown>) => block.text ?? "")
      .join("\n");
  }

  return "";
}

function readLines(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  return content.split("\n").filter((line) => line.trim());
}

export function parseSessionFile(filePath: string): ParsedSessionMetadata {
  const lines = readLines(filePath);
  if (lines.length === 0) {
    return { preview: "(unreadable)", gitBranch: "", cwd: "", messageCount: 0 };
  }

  let userCount = 0;
  let assistantCount = 0;
  let preview = "(no preview)";
  let gitBranch = "";
  let cwd = "";

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      if (data.type === "user") {
        userCount++;
        if (userCount === 1) {
          const text = extractMessageText(data).replace(/\s+/g, " ").trim().slice(0, 80);
          if (text && !text.startsWith("<")) {
            preview = text;
          }
          gitBranch = data.gitBranch ?? "";
          cwd = data.cwd ?? "";
        }
      } else if (data.type === "assistant") {
        assistantCount++;
      }
    } catch {
      continue;
    }
  }

  return {
    preview,
    gitBranch,
    cwd,
    messageCount: userCount + assistantCount,
  };
}

const DEFAULT_MAX_MESSAGES = 20;

export function parseSessionDetail(
  filePath: string,
  maxMessages: number = DEFAULT_MAX_MESSAGES,
): ParsedSessionDetail {
  const lines = readLines(filePath);
  if (lines.length === 0) {
    return { messages: [], totalMessages: 0, gitBranch: "", cwd: "" };
  }

  const messages: SessionMessage[] = [];
  let totalMessages = 0;
  let gitBranch = "";
  let cwd = "";

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      if (data.type === "user" || data.type === "assistant") {
        totalMessages++;

        if (data.type === "user" && !gitBranch) {
          gitBranch = data.gitBranch ?? "";
          cwd = data.cwd ?? "";
        }

        if (messages.length < maxMessages) {
          const content = extractMessageText(data).trim();
          if (content) {
            messages.push({ role: data.type, content });
          }
        }
      }
    } catch {
      continue;
    }
  }

  return { messages, totalMessages, gitBranch, cwd };
}
