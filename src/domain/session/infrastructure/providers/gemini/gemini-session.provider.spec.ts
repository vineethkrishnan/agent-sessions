import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { GeminiSessionProvider } from "./gemini-session.provider.js";

describe("GeminiSessionProvider", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gemini-repo-test-"));
    const projectHashDir = path.join(tmpDir, "abc123hash");
    const chatsDir = path.join(projectHashDir, "chats");
    fs.mkdirSync(chatsDir, { recursive: true });

    const session1 = path.join(chatsDir, "session-aaa.json");

    fs.writeFileSync(
      session1,
      JSON.stringify({
        sessionId: "gemini-123",
        project: "my-project",
        messages: [
          { type: "user", content: "Gemini query" },
          { type: "gemini", content: "Here is the answer" },
        ],
        cwd: "/tmp/gemini-app",
      }),
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds and parses Gemini session files from JSON in chats directory", async () => {
    const provider = new GeminiSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.project).toBe("my-project");
    expect(sessions[0]!.preview).toBe("Gemini query");
    expect(sessions[0]!.provider).toBe("Gemini");
  });

  it("getDetail returns conversation messages", async () => {
    const provider = new GeminiSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    const detail = await provider.getDetail(sessions[0]!.filePath);

    expect(detail.messages).toHaveLength(2);
    expect(detail.messages[0]!.role).toBe("user");
    expect(detail.messages[0]!.content).toBe("Gemini query");
    expect(detail.messages[1]!.role).toBe("assistant");
    expect(detail.messages[1]!.content).toBe("Here is the answer");
  });

  it("has correct name and resume args", () => {
    const provider = new GeminiSessionProvider(tmpDir);
    expect(provider.name).toBe("Gemini");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "gemini",
      args: ["--resume", "test-id"],
    });
  });
});
