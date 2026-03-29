import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ClaudeSessionProvider } from "./claude-session.provider.js";

describe("ClaudeSessionProvider", () => {
  let tmpDir: string;
  let projectDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-repo-test-"));
    // Claude provider expects a dir containing encoded project dirs
    projectDir = path.join(tmpDir, "-Users-test-projects-app");
    fs.mkdirSync(projectDir, { recursive: true });

    const session1 = path.join(projectDir, "session-aaa.jsonl");
    const session2 = path.join(projectDir, "session-bbb.jsonl");

    fs.writeFileSync(
      session1,
      JSON.stringify({
        type: "user",
        message: { content: "Hello world" },
        gitBranch: "main",
        cwd: "/tmp/app",
      }) + "\n",
    );
    fs.writeFileSync(
      session2,
      JSON.stringify({
        type: "user",
        message: { content: "Fix the bug" },
        gitBranch: "fix/bug",
        cwd: "/tmp/app",
      }) + "\n",
    );

    const now = Date.now();
    fs.utimesSync(session1, new Date(now - 10000), new Date(now - 10000));
    fs.utimesSync(session2, new Date(now), new Date(now));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds and parses all session files", async () => {
    const provider = new ClaudeSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    // Sort is handled by repository now, but provider returns them as it finds them.
    // Actually the repository sorts them. Let's just check length and content.
    expect(sessions).toHaveLength(2);
  });

  it("extracts metadata from session files", async () => {
    const provider = new ClaudeSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    const sessionBBB = sessions.find((s) => s.id === "session-bbb")!;
    expect(sessionBBB.preview).toBe("Fix the bug");
    expect(sessionBBB.gitBranch).toBe("fix/bug");
  });

  it("returns empty array for non-existent directory", async () => {
    const provider = new ClaudeSessionProvider("/nonexistent/path");
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(0);
  });

  it("getDetail returns parsed conversation messages", async () => {
    const provider = new ClaudeSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    const s1 = sessions.find((s) => s.id === "session-bbb")!;
    const detail = await provider.getDetail(s1.filePath);

    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0]!.role).toBe("user");
    expect(detail.messages[0]!.content).toBe("Fix the bug");
    expect(detail.totalMessages).toBe(1);
  });

  it("has correct name and resume command", () => {
    const provider = new ClaudeSessionProvider(tmpDir);
    expect(provider.name).toBe("Claude");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "claude",
      args: ["--resume", "test-id"],
    });
  });
});
