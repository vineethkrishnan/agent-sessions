import fs from "node:fs";

export interface ParsedSessionMetadata {
  preview: string;
  gitBranch: string;
  cwd: string;
  messageCount: number;
}

export function parseSessionFile(filePath: string): ParsedSessionMetadata {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return { preview: "(unreadable)", gitBranch: "", cwd: "", messageCount: 0 };
  }

  let userCount = 0;
  let assistantCount = 0;
  let preview = "(no preview)";
  let gitBranch = "";
  let cwd = "";

  for (const line of content.split("\n")) {
    if (!line.trim()) continue;

    try {
      const data = JSON.parse(line);

      if (data.type === "user") {
        userCount++;
        if (userCount === 1) {
          const messageContent = data.message?.content ?? "";
          let text: string;

          if (typeof messageContent === "string") {
            text = messageContent;
          } else if (Array.isArray(messageContent) && messageContent.length > 0) {
            text = messageContent[0]?.text ?? "";
          } else {
            text = "";
          }

          text = text.replace(/\s+/g, " ").trim().slice(0, 80);

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
