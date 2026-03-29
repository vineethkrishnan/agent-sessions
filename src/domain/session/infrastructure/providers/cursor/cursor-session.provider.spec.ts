import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { CursorSessionProvider } from "./cursor-session.provider.js";

describe("CursorSessionProvider", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cursor-repo-test-"));
    const session1 = path.join(tmpDir, "session-aaa.jsonl");

    fs.writeFileSync(
      session1,
      JSON.stringify({
        type: "user",
        message: {
          role: "user",
          content: [{ type: "text", text: "Build a new UI component" }],
        },
        session_id: "cursor-123",
      }) + "\n",
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds and parses Cursor session from JSONL files", async () => {
    const provider = new CursorSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.id).toBe("session-aaa");
    expect(sessions[0]!.preview).toBe("Build a new UI component");
    expect(sessions[0]!.provider).toBe("Cursor");
  });

  it("getDetail returns conversation messages", async () => {
    const provider = new CursorSessionProvider(tmpDir);
    const sessions = await provider.findAll();
    const detail = await provider.getDetail(sessions[0]!.filePath);

    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0]!.role).toBe("user");
    expect(detail.messages[0]!.content).toBe("Build a new UI component");
  });

  it("has correct name and resume command", () => {
    const provider = new CursorSessionProvider(tmpDir);
    expect(provider.name).toBe("Cursor");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "agent",
      args: ["--resume", "test-id"],
    });
  });
});
