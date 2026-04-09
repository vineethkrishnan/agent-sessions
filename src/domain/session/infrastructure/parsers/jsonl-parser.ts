import fs from "node:fs";
import readline from "node:readline";
import type { SessionMessage } from "../../domain/session-detail.model.js";

interface ParsedSessionMetadata {
  preview: string;
  gitBranch: string;
  cwd: string;
  messageCount: number;
}

interface ParsedSessionDetail {
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

export function readLines(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  return content.split("\n").filter((line) => line.trim());
}

export function stringifyContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part.text || JSON.stringify(part)))
      .join("\n");
  }
  if (!content) return "";
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

/**
 * Streams the JSONL file line-by-line, counting messages and extracting
 * metadata from only the first user message. Avoids reading the entire
 * file into memory.
 */
export async function parseSessionFileAsync(filePath: string): Promise<ParsedSessionMetadata> {
  let fd: number;
  try {
    fd = fs.openSync(filePath, "r");
  } catch {
    return { preview: "(unreadable)", gitBranch: "", cwd: "", messageCount: 0 };
  }

  const stream = fs.createReadStream("", { fd, encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let userCount = 0;
  let assistantCount = 0;
  let preview = "(no preview)";
  let gitBranch = "";
  let cwd = "";

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);

      if (entry.type === "user") {
        userCount++;
        if (userCount === 1) {
          const text = extractMessageText(entry).replace(/\s+/g, " ").trim().slice(0, 80);
          if (text && !text.startsWith("<")) {
            preview = text;
          }
          gitBranch = entry.gitBranch ?? "";
          cwd = entry.cwd ?? "";
        }
      } else if (entry.type === "assistant") {
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

/** Synchronous fallback — reads entire file. Use parseSessionFileAsync when possible. */
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
      const entry = JSON.parse(line);

      if (entry.type === "user") {
        userCount++;
        if (userCount === 1) {
          const text = extractMessageText(entry).replace(/\s+/g, " ").trim().slice(0, 80);
          if (text && !text.startsWith("<")) {
            preview = text;
          }
          gitBranch = entry.gitBranch ?? "";
          cwd = entry.cwd ?? "";
        }
      } else if (entry.type === "assistant") {
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
      const entry = JSON.parse(line);

      if (entry.type === "user" || entry.type === "assistant") {
        totalMessages++;

        if (entry.type === "user" && !gitBranch) {
          gitBranch = entry.gitBranch ?? "";
          cwd = entry.cwd ?? "";
        }

        if (messages.length < maxMessages) {
          const content = extractMessageText(entry).trim();
          if (content) {
            messages.push({ role: entry.type, content });
          }
        }
      }
    } catch {
      continue;
    }
  }

  return { messages, totalMessages, gitBranch, cwd };
}
