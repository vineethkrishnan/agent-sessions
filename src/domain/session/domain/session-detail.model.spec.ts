import { describe, it, expect } from "vitest";
import { SessionDetail } from "./session-detail.model.js";

describe("SessionDetail", () => {
  it("creates a detail with messages and counts", () => {
    const detail = new SessionDetail({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      totalMessages: 10,
      cwd: "/home/user/app",
      gitBranch: "main",
    });

    expect(detail.loadedMessages).toBe(2);
    expect(detail.totalMessages).toBe(10);
    expect(detail.cwd).toBe("/home/user/app");
    expect(detail.gitBranch).toBe("main");
  });

  it("hasMore returns true when total exceeds loaded", () => {
    const detail = new SessionDetail({
      messages: [{ role: "user", content: "Hello" }],
      totalMessages: 5,
      cwd: "",
      gitBranch: "",
    });

    expect(detail.hasMore).toBe(true);
  });

  it("hasMore returns false when all messages are loaded", () => {
    const detail = new SessionDetail({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ],
      totalMessages: 2,
      cwd: "",
      gitBranch: "",
    });

    expect(detail.hasMore).toBe(false);
  });

  it("handles empty messages", () => {
    const detail = new SessionDetail({
      messages: [],
      totalMessages: 0,
      cwd: "",
      gitBranch: "",
    });

    expect(detail.loadedMessages).toBe(0);
    expect(detail.hasMore).toBe(false);
  });
});
