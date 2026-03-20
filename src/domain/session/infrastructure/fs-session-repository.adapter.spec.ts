import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { FsSessionRepositoryAdapter } from "./fs-session-repository.adapter.js";

describe("FsSessionRepositoryAdapter", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-repo-test-"));
    const projectDir = path.join(tmpDir, "-Users-test-projects-app");
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

  it("finds and parses all session files", () => {
    const adapter = new FsSessionRepositoryAdapter(tmpDir);
    expect(adapter.findAll()).toHaveLength(2);
  });

  it("sorts sessions by modification time (newest first)", () => {
    const adapter = new FsSessionRepositoryAdapter(tmpDir);
    const sessions = adapter.findAll();
    expect(sessions[0]!.id).toBe("session-bbb");
    expect(sessions[1]!.id).toBe("session-aaa");
  });

  it("extracts metadata from session files", () => {
    const adapter = new FsSessionRepositoryAdapter(tmpDir);
    const newest = adapter.findAll()[0]!;
    expect(newest.preview).toBe("Fix the bug");
    expect(newest.gitBranch).toBe("fix/bug");
  });

  it("returns empty array for non-existent directory", () => {
    const adapter = new FsSessionRepositoryAdapter("/nonexistent/path");
    expect(adapter.findAll()).toHaveLength(0);
  });
});
