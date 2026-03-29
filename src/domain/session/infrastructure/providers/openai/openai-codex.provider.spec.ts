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

  it("has correct name and resume args", () => {
    const provider = new OpenAICodexProvider(tmpDir);
    expect(provider.name).toBe("OpenAI");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "codex",
      args: ["resume", "test-id"],
    });
  });
});
