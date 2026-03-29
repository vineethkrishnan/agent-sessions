import { describe, it, expect } from "vitest";
import { Session, type SessionParams } from "./session.model.js";

function makeSession(overrides: Partial<SessionParams> = {}) {
  const params: SessionParams = {
    id: "abc-123",
    filePath: "/tmp/abc-123.jsonl",
    project: "~/projects/my-app",
    gitBranch: "feat/login",
    messageCount: 5,
    preview: "Fix the login bug",
    modifiedAt: new Date("2026-03-17T10:00:00Z"),
    cwd: "/Users/test/projects/my-app",
    provider: "Claude",
    ...overrides,
  };
  return new Session(params);
}

describe("Session", () => {
  it("creates a session with all fields", () => {
    const session = makeSession();
    expect(session.id).toBe("abc-123");
    expect(session.project).toBe("~/projects/my-app");
    expect(session.messageCount).toBe(5);
    expect(session.provider).toBe("Claude");
  });

  describe("matchesFilter", () => {
    it("returns true for empty query", () => {
      expect(makeSession().matchesFilter("")).toBe(true);
    });

    it("matches against project name", () => {
      expect(makeSession().matchesFilter("my-app")).toBe(true);
    });

    it("matches against git branch", () => {
      expect(makeSession().matchesFilter("login")).toBe(true);
    });

    it("matches against preview text", () => {
      expect(makeSession().matchesFilter("Fix the")).toBe(true);
    });

    it("matches against provider name", () => {
      expect(makeSession().matchesFilter("Claude")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(makeSession().matchesFilter("FIX THE LOGIN")).toBe(true);
    });

    it("returns false for non-matching query", () => {
      expect(makeSession().matchesFilter("nonexistent")).toBe(false);
    });
  });
});
