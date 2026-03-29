import { describe, it, expect } from "vitest";
import { parseSessionFile, parseSessionDetail, extractMessageText } from "./jsonl-parser.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function createTempFile(lines: object[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-test-"));
  const filePath = path.join(dir, "test-session.jsonl");
  fs.writeFileSync(filePath, lines.map((l) => JSON.stringify(l)).join("\n"));
  return filePath;
}

describe("parseSessionFile", () => {
  it("extracts metadata from a standard session", () => {
    const filePath = createTempFile([
      {
        type: "user",
        message: { content: "Fix the login bug" },
        gitBranch: "fix/auth",
        cwd: "/home/user/app",
      },
      { type: "assistant", message: { content: "Looking into it." } },
      {
        type: "user",
        message: { content: "Also check timeout" },
        gitBranch: "fix/auth",
        cwd: "/home/user/app",
      },
      { type: "assistant", message: { content: "Done." } },
    ]);

    const result = parseSessionFile(filePath);

    expect(result.preview).toBe("Fix the login bug");
    expect(result.gitBranch).toBe("fix/auth");
    expect(result.cwd).toBe("/home/user/app");
    expect(result.messageCount).toBe(4);
  });

  it("handles array content format", () => {
    const filePath = createTempFile([
      {
        type: "user",
        message: { content: [{ type: "text", text: "Refactor the DB" }] },
        gitBranch: "main",
        cwd: "/tmp",
      },
    ]);

    expect(parseSessionFile(filePath).preview).toBe("Refactor the DB");
  });

  it("skips system messages starting with <", () => {
    const filePath = createTempFile([
      {
        type: "user",
        message: { content: "<system>internal</system>" },
        gitBranch: "main",
        cwd: "/tmp",
      },
    ]);

    expect(parseSessionFile(filePath).preview).toBe("(no preview)");
  });

  it("returns fallback for empty session", () => {
    const filePath = createTempFile([{ type: "file-history-snapshot", snapshot: {} }]);

    const result = parseSessionFile(filePath);
    expect(result.preview).toBe("(no preview)");
    expect(result.messageCount).toBe(0);
  });

  it("returns unreadable for missing file", () => {
    const result = parseSessionFile("/nonexistent/path.jsonl");
    expect(result.preview).toBe("(unreadable)");
  });

  it("truncates long previews to 80 chars", () => {
    const filePath = createTempFile([
      {
        type: "user",
        message: { content: "a".repeat(200) },
        gitBranch: "main",
        cwd: "/tmp",
      },
    ]);

    expect(parseSessionFile(filePath).preview.length).toBe(80);
  });
});

describe("extractMessageText", () => {
  it("extracts from string content", () => {
    const data = { message: { content: "Hello world" } };
    expect(extractMessageText(data)).toBe("Hello world");
  });

  it("extracts from array content with text blocks", () => {
    const data = {
      message: {
        content: [
          { type: "text", text: "First part" },
          { type: "text", text: "Second part" },
        ],
      },
    };
    expect(extractMessageText(data)).toBe("First part\nSecond part");
  });

  it("filters out non-text blocks", () => {
    const data = {
      message: {
        content: [
          { type: "text", text: "Visible" },
          { type: "tool_use", name: "read_file" },
        ],
      },
    };
    expect(extractMessageText(data)).toBe("Visible");
  });

  it("returns empty string for missing message", () => {
    expect(extractMessageText({})).toBe("");
  });
});

describe("parseSessionDetail", () => {
  it("extracts messages from a standard session", () => {
    const filePath = createTempFile([
      {
        type: "user",
        message: { content: "Fix the login bug" },
        gitBranch: "fix/auth",
        cwd: "/home/user/app",
      },
      { type: "assistant", message: { content: "Looking into it." } },
      {
        type: "user",
        message: { content: "Also check timeout" },
        gitBranch: "fix/auth",
        cwd: "/home/user/app",
      },
      { type: "assistant", message: { content: "Done." } },
    ]);

    const result = parseSessionDetail(filePath);

    expect(result.messages).toHaveLength(4);
    expect(result.totalMessages).toBe(4);
    expect(result.gitBranch).toBe("fix/auth");
    expect(result.cwd).toBe("/home/user/app");
    expect(result.messages[0]).toEqual({ role: "user", content: "Fix the login bug" });
    expect(result.messages[1]).toEqual({ role: "assistant", content: "Looking into it." });
  });

  it("respects maxMessages limit", () => {
    const filePath = createTempFile([
      { type: "user", message: { content: "msg 1" }, gitBranch: "main", cwd: "/tmp" },
      { type: "assistant", message: { content: "reply 1" } },
      { type: "user", message: { content: "msg 2" }, gitBranch: "main", cwd: "/tmp" },
      { type: "assistant", message: { content: "reply 2" } },
      { type: "user", message: { content: "msg 3" }, gitBranch: "main", cwd: "/tmp" },
      { type: "assistant", message: { content: "reply 3" } },
    ]);

    const result = parseSessionDetail(filePath, 2);

    expect(result.messages).toHaveLength(2);
    expect(result.totalMessages).toBe(6);
  });

  it("skips non-user/assistant entries", () => {
    const filePath = createTempFile([
      { type: "file-history-snapshot", snapshot: {} },
      { type: "user", message: { content: "Hello" }, gitBranch: "main", cwd: "/tmp" },
      { type: "summary", data: "some summary" },
      { type: "assistant", message: { content: "Hi" } },
    ]);

    const result = parseSessionDetail(filePath);

    expect(result.messages).toHaveLength(2);
    expect(result.totalMessages).toBe(2);
  });

  it("returns empty detail for missing file", () => {
    const result = parseSessionDetail("/nonexistent/path.jsonl");

    expect(result.messages).toHaveLength(0);
    expect(result.totalMessages).toBe(0);
  });

  it("skips messages with empty content", () => {
    const filePath = createTempFile([
      { type: "user", message: { content: "" }, gitBranch: "main", cwd: "/tmp" },
      { type: "assistant", message: { content: "Reply" } },
    ]);

    const result = parseSessionDetail(filePath);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.role).toBe("assistant");
    expect(result.totalMessages).toBe(2);
  });
});
