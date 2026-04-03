import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import { CursorSessionProvider } from "./cursor-session.provider.js";

function createTestDb(dbPath: string, meta: Record<string, unknown>, messages: unknown[]) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.exec("CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT)");
  db.exec("CREATE TABLE blobs (id TEXT PRIMARY KEY, data BLOB)");

  const metaHex = Buffer.from(JSON.stringify(meta), "utf-8").toString("hex");
  db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run("0", metaHex);

  messages.forEach((msg, i) => {
    db.prepare("INSERT INTO blobs (id, data) VALUES (?, ?)").run(`blob-${i}`, JSON.stringify(msg));
  });

  db.close();
}

describe("CursorSessionProvider", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cursor-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds and parses Cursor sessions from SQLite store.db", async () => {
    const dbPath = path.join(tmpDir, "abc123", "uuid-1", "store.db");

    createTestDb(dbPath, { agentId: "uuid-1", name: "My Session", createdAt: Date.now() }, [
      { role: "user", content: "Build a new UI component" },
      { role: "assistant", content: "I'll help you build that." },
    ]);

    const provider = new CursorSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.id).toBe("uuid-1");
    expect(sessions[0]!.project).toBe("My Session");
    expect(sessions[0]!.preview).toBe("Build a new UI component");
    expect(sessions[0]!.provider).toBe("Cursor");
    expect(sessions[0]!.messageCount).toBe(2);
  });

  it("extracts user query from Cursor XML wrapper", async () => {
    const dbPath = path.join(tmpDir, "abc123", "uuid-2", "store.db");

    createTestDb(dbPath, { agentId: "uuid-2", name: "Wrapped Query", createdAt: Date.now() }, [
      {
        role: "user",
        content: "<user_info>\nOS: darwin\nWorkspace Path: /home/test\n</user_info>",
      },
      {
        role: "user",
        content: "<user_query>\nFix the login bug\n</user_query>",
      },
      { role: "assistant", content: "I'll look into the login bug." },
    ]);

    const provider = new CursorSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions[0]!.preview).toBe("Fix the login bug");
    expect(sessions[0]!.cwd).toBe("/home/test");
  });

  it("getDetail returns conversation messages", async () => {
    const dbPath = path.join(tmpDir, "abc123", "uuid-3", "store.db");

    createTestDb(dbPath, { agentId: "uuid-3", name: "Detail Test", createdAt: Date.now() }, [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "Help me" },
    ]);

    const provider = new CursorSessionProvider(tmpDir);
    const detail = await provider.getDetail(dbPath);

    expect(detail.messages).toHaveLength(3);
    expect(detail.messages[0]!.role).toBe("user");
    expect(detail.messages[0]!.content).toBe("Hello");
    expect(detail.messages[1]!.role).toBe("assistant");
    expect(detail.messages[1]!.content).toBe("Hi there!");
    expect(detail.totalMessages).toBe(3);
  });

  it("skips non-message blobs", async () => {
    const dbPath = path.join(tmpDir, "abc123", "uuid-4", "store.db");

    createTestDb(dbPath, { agentId: "uuid-4", name: "Mixed Blobs", createdAt: Date.now() }, [
      { role: "system", content: "System prompt" },
      { role: "user", content: "Real question" },
      { role: "assistant", content: "Answer" },
      { type: "tool_call", name: "readFile" },
    ]);

    const provider = new CursorSessionProvider(tmpDir);
    const sessions = await provider.findAll();

    expect(sessions[0]!.messageCount).toBe(2);
    expect(sessions[0]!.preview).toBe("Real question");
  });

  it("returns empty for non-existent directory", async () => {
    const provider = new CursorSessionProvider("/tmp/nonexistent-cursor-path");
    const sessions = await provider.findAll();
    expect(sessions).toHaveLength(0);
  });

  it("has correct name and resume command", () => {
    const provider = new CursorSessionProvider(tmpDir);
    expect(provider.name).toBe("Cursor");
    expect(provider.buildResumeArgs("test-id")).toEqual({
      command: "cursor",
      args: ["--resume", "test-id"],
    });
  });
});
