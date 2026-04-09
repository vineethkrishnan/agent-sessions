import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { OpenAICodexProvider } from "./openai-codex.provider.js";

describe("OpenAICodexProvider", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-repo-test-"));
    const nestedDir = path.join(tmpDir, "2026", "03", "26");
    fs.mkdirSync(nestedDir, { recursive: true });

    const session1 = path.join(nestedDir, "rollout-session-aaa.jsonl");

    fs.writeFileSync(
      session1,
      JSON.stringify({
        role: "user",
        content: "Codex query",
      }) + "\n",
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("recursively finds session files in date-based directory structure", async () => {
    const provider = new OpenAICodexProvider(tmpDir);
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.preview).toBe("Codex query");
    expect(sessions[0]!.provider).toBe("OpenAI");
  });

  it("getDetail returns conversation messages", async () => {
    const provider = new OpenAICodexProvider(tmpDir);
    const sessions = await provider.findAll();
    const detail = await provider.getDetail(sessions[0]!.filePath);

    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0]!.role).toBe("user");
    expect(detail.messages[0]!.content).toBe("Codex query");
  });

  it("extracts metadata (cwd, gitBranch, project) from JSONL entries", async () => {
    const nestedDir = path.join(tmpDir, "2026", "04");
    fs.mkdirSync(nestedDir, { recursive: true });
    const sessionFile = path.join(nestedDir, "meta-session.jsonl");
    fs.writeFileSync(
      sessionFile,
      [
        JSON.stringify({ cwd: "/home/user/app", gitBranch: "feat/api", project: "my-app" }),
        JSON.stringify({ role: "user", content: "Build the API" }),
        JSON.stringify({ role: "assistant", content: "Sure, I'll build it." }),
      ].join("\n"),
    );

    const provider = new OpenAICodexProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions).toHaveLength(2);
    const session = sessions.find((s) => s.id === "meta-session");
    expect(session!.cwd).toBe("/home/user/app");
    expect(session!.gitBranch).toBe("feat/api");
    expect(session!.project).toBe("my-app");
  });

  it("getDetail returns metadata from JSONL entries", async () => {
    const nestedDir = path.join(tmpDir, "2026", "04");
    fs.mkdirSync(nestedDir, { recursive: true });
    const sessionFile = path.join(nestedDir, "detail-meta.jsonl");
    fs.writeFileSync(
      sessionFile,
      [
        JSON.stringify({ cwd: "/home/user/project", gitBranch: "main" }),
        JSON.stringify({ role: "user", content: "Hello" }),
        JSON.stringify({ role: "assistant", content: "Hi" }),
      ].join("\n"),
    );

    const provider = new OpenAICodexProvider(tmpDir);
    const detail = await provider.getDetail(sessionFile);

    expect(detail.cwd).toBe("/home/user/project");
    expect(detail.gitBranch).toBe("main");
    expect(detail.messages).toHaveLength(2);
  });

  it("returns empty array for non-existent directory", async () => {
    const provider = new OpenAICodexProvider("/tmp/nonexistent-codex-path");
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(0);
  });

  it("has correct name and resume args", () => {
    const provider = new OpenAICodexProvider(tmpDir);
    expect(provider.name).toBe("OpenAI");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "codex",
      args: ["resume", "test-id"],
    });
  });
});
