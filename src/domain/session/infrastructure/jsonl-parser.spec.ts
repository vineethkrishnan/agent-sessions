import { describe, it, expect } from "vitest";
import { parseSessionFile } from "./jsonl-parser.js";
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
