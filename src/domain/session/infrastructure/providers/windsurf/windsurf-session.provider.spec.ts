import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { WindsurfSessionProvider } from "./windsurf-session.provider.js";

describe("WindsurfSessionProvider", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "windsurf-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds and parses Windsurf session files from JSON", async () => {
    const sessionFile = path.join(tmpDir, "conv-aaa.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        conversationId: "conv-aaa",
        title: "Fix Auth",
        workspace: "/home/user/project",
        cwd: "/home/user/project",
        gitBranch: "main",
        messages: [
          { role: "user", content: "Fix the auth bug" },
          { role: "assistant", content: "I'll look into it." },
        ],
      }),
    );

    const provider = new WindsurfSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.id).toBe("conv-aaa");
    expect(sessions[0]!.project).toBe("Fix Auth");
    expect(sessions[0]!.preview).toBe("Fix the auth bug");
    expect(sessions[0]!.provider).toBe("Windsurf");
    expect(sessions[0]!.messageCount).toBe(2);
    expect(sessions[0]!.cwd).toBe("/home/user/project");
    expect(sessions[0]!.gitBranch).toBe("main");
  });

  it("getDetail returns conversation messages with metadata", async () => {
    const sessionFile = path.join(tmpDir, "conv-bbb.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        conversationId: "conv-bbb",
        workspace: "/home/user/app",
        gitBranch: "feat/ui",
        messages: [
          { role: "user", content: "Add a button" },
          { role: "assistant", content: "Here is the button component." },
          { role: "user", content: "Make it blue" },
        ],
      }),
    );

    const provider = new WindsurfSessionProvider(tmpDir);
    const detail = await provider.getDetail(sessionFile);

    expect(detail.messages).toHaveLength(3);
    expect(detail.messages[0]!.role).toBe("user");
    expect(detail.messages[0]!.content).toBe("Add a button");
    expect(detail.messages[2]!.content).toBe("Make it blue");
    expect(detail.totalMessages).toBe(3);
    expect(detail.cwd).toBe("/home/user/app");
    expect(detail.gitBranch).toBe("feat/ui");
  });

  it("skips non-user/assistant messages", async () => {
    const sessionFile = path.join(tmpDir, "conv-ccc.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        messages: [
          { role: "system", content: "System prompt" },
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi" },
          { role: "tool", content: "Tool result" },
        ],
      }),
    );

    const provider = new WindsurfSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.messageCount).toBe(2);
    expect(sessions[0]!.preview).toBe("Hello");
  });

  it("uses workspace as fallback for project and cwd", async () => {
    const sessionFile = path.join(tmpDir, "conv-ddd.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        workspace: "/home/user/my-app",
        messages: [{ role: "user", content: "Help" }],
      }),
    );

    const provider = new WindsurfSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions[0]!.project).toBe("/home/user/my-app");
    expect(sessions[0]!.cwd).toBe("/home/user/my-app");
  });

  it("uses filename as ID when conversationId is missing", async () => {
    const sessionFile = path.join(tmpDir, "my-session.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        messages: [{ role: "user", content: "Test" }],
      }),
    );

    const provider = new WindsurfSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions[0]!.id).toBe("my-session");
  });

  it("returns empty for non-existent directory", async () => {
    const provider = new WindsurfSessionProvider("/tmp/nonexistent-windsurf-path");
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(0);
  });

  it("skips sessions with no messages", async () => {
    const sessionFile = path.join(tmpDir, "empty.json");
    fs.writeFileSync(sessionFile, JSON.stringify({ messages: [] }));

    const provider = new WindsurfSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions).toHaveLength(0);
  });

  it("skips invalid JSON files", async () => {
    fs.writeFileSync(path.join(tmpDir, "bad.json"), "not valid json{{{");
    fs.writeFileSync(
      path.join(tmpDir, "good.json"),
      JSON.stringify({
        messages: [{ role: "user", content: "Valid" }],
      }),
    );

    const provider = new WindsurfSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.preview).toBe("Valid");
  });

  it("getDetail returns empty for invalid file", async () => {
    const provider = new WindsurfSessionProvider(tmpDir);
    const detail = await provider.getDetail("/tmp/nonexistent.json");

    expect(detail.messages).toHaveLength(0);
    expect(detail.totalMessages).toBe(0);
  });

  it("has correct name and resume args", () => {
    const provider = new WindsurfSessionProvider(tmpDir);
    expect(provider.name).toBe("Windsurf");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "windsurf",
      args: ["--resume", "test-id"],
    });
  });
});
