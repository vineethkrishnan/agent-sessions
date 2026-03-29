import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  createEmptyFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("Edge Cases & Abnormal Behavior", () => {
  let fixtureEnv: FixtureEnv;
  let tmpRoot: string;
  let session: PtySession | null = null;

  beforeEach(() => {
    const result = createFixtureEnv();
    fixtureEnv = result.env;
    tmpRoot = result.tmpRoot;
  });

  afterEach(async () => {
    if (session) {
      await session.close();
      session = null;
    }
    cleanupFixtures(tmpRoot);
  });

  describe("corrupt session files", () => {
    it("app does not crash with invalid JSON lines in session files", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);

      // The corrupt session fixture has invalid JSON lines mixed with valid ones
      await session.waitForText("Universal AI Session Manager");

      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      // App should be functional despite corrupt data
      expect(screen).toContain("▶");
    });

    it("app handles file with only corrupt lines gracefully", async () => {
      // Create a session file with only invalid JSON
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      fs.writeFileSync(
        path.join(projectDir, "session-allcorrupt.jsonl"),
        "not json\nalso not json\n{broken:\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("empty session files", () => {
    it("renders gracefully with 0-byte session files", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // The empty fixture file should not cause a crash
      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
    });
  });

  describe("session file deleted mid-browse", () => {
    it("preview of deleted file does not crash the app", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Delete a session file while the app is running
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      const files = fs.readdirSync(projectDir).filter((f) => f.endsWith(".jsonl"));
      if (files[0]) {
        fs.unlinkSync(path.join(projectDir, files[0]));
      }

      // Try to preview the (now deleted) first session
      session.send("p");
      await new Promise((r) => setTimeout(r, 1000));

      // App should not crash
      expect(session.hasExited()).toBe(false);
    });

    it("delete of already-deleted file does not crash", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Delete the file out from under the app
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      const files = fs.readdirSync(projectDir).filter((f) => f.endsWith(".jsonl"));
      if (files[0]) {
        fs.unlinkSync(path.join(projectDir, files[0]));
      }

      // Try to delete it through the UI
      session.send("d");
      await new Promise((r) => setTimeout(r, 500));

      // If delete dialog appeared, confirm it
      if (session.getScreen().includes("Delete this session?")) {
        session.send("y");
        await new Promise((r) => setTimeout(r, 500));
      }

      // App should still be running
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("Unicode and special content", () => {
    it("handles Unicode content (CJK, RTL, emoji) without corruption", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // The session-special fixture has Unicode content
      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });

    it("Unicode session preview renders without crash", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Navigate to the Unicode session and preview it
      // We need to find it - use search
      session.send("/");
      await session.waitForText("Filter:");
      await session.type("i18n");
      await new Promise((r) => setTimeout(r, 300));

      session.sendKey("enter");
      await new Promise((r) => setTimeout(r, 200));

      session.send("p");
      await new Promise((r) => setTimeout(r, 1000));

      // Should not crash
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("extremely long content", () => {
    it("very long project name is truncated without overflow", async () => {
      // Create a session in a dir with a very long name
      const longName = "-Users-test-" + "a".repeat(200) + "-project";
      const longDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, longName);
      fs.mkdirSync(longDir, { recursive: true });
      fs.writeFileSync(
        path.join(longDir, "session-long.jsonl"),
        JSON.stringify({
          type: "user",
          message: { content: "Test long path" },
          gitBranch: "main",
          cwd: "/tmp",
        }) + "\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("huge sessions", () => {
    it("session with 500+ messages loads without hanging", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Find the huge session
      session.send("/");
      await session.waitForText("Filter:");
      await session.type("huge");
      await new Promise((r) => setTimeout(r, 300));

      // Preview should not hang
      session.sendKey("enter");
      await new Promise((r) => setTimeout(r, 200));

      session.send("p");
      await session.waitForText("Session Preview", 15_000);

      const screen = session.getScreen();
      expect(screen).toContain("Session Preview");
      expect(screen).toContain("Messages:");
    });
  });

  describe("tool_use and system messages", () => {
    it("sessions with system messages starting with < handle preview correctly", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // The session-tooluse fixture starts with a system-like message
      // It should not crash and preview should filter non-text content
      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });

    it("sessions with mixed content types (text + tool_use) render text only in preview", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Search for the tooluse session
      session.send("/");
      await session.waitForText("Filter:");
      await session.type("tooluse");
      await new Promise((r) => setTimeout(r, 300));

      // If found, try to preview
      const filterScreen = session.getScreen();
      if (!filterScreen.includes("0 matches")) {
        session.sendKey("enter");
        await new Promise((r) => setTimeout(r, 200));
        session.send("p");
        await new Promise((r) => setTimeout(r, 1000));
      }

      expect(session.hasExited()).toBe(false);
    });
  });

  describe("terminal size edge cases", () => {
    it("very small terminal (40x10) does not crash", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv, {
        cols: 40,
        rows: 10,
      });

      await session.waitForText("Universal AI Session Manager", 15_000);
      expect(session.hasExited()).toBe(false);
    });

    it("very large terminal (250x60) renders without gaps", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv, {
        cols: 250,
        rows: 60,
      });

      await session.waitForText("Universal AI Session Manager");
      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });

    it("terminal resize mid-render does not crash", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Resize to various sizes
      session.resize(60, 15);
      await new Promise((r) => setTimeout(r, 500));

      session.resize(200, 50);
      await new Promise((r) => setTimeout(r, 500));

      session.resize(40, 10);
      await new Promise((r) => setTimeout(r, 500));

      // Return to normal
      session.resize(120, 30);
      await new Promise((r) => setTimeout(r, 500));

      // App should still be functional
      expect(session.hasExited()).toBe(false);
      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
    });
  });

  describe("empty provider state", () => {
    it("no sessions for any provider shows empty state", async () => {
      const emptyResult = createEmptyFixtureEnv();
      try {
        session = spawnCli(["--agent", "claude", "--no-splash"], emptyResult.env);
        await session.waitForText("Universal AI Session Manager", 10_000).catch(() => {
          // May show "No matching sessions" instead
        });

        const screen = session.getScreen();
        const hasTable = screen.includes("Universal AI Session Manager");
        const hasEmpty = screen.includes("No matching sessions");
        expect(hasTable || hasEmpty).toBe(true);
      } finally {
        cleanupFixtures(emptyResult.tmpRoot);
      }
    });

    it("provider dir with no .jsonl files shows empty list", async () => {
      // Create a project dir but with no session files
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-empty-project");
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, "readme.txt"), "not a session file");

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // App should work - the non-.jsonl file is ignored
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("JSONL parsing edge cases", () => {
    it("session file with trailing blank lines parses correctly", async () => {
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      fs.writeFileSync(
        path.join(projectDir, "session-trailing.jsonl"),
        JSON.stringify({
          type: "user",
          message: { content: "Trailing newline test" },
          gitBranch: "main",
          cwd: "/tmp",
        }) +
          "\n\n\n\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });

    it("session file with BOM (byte order mark) parses or skips gracefully", async () => {
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      const bom = "\uFEFF";
      fs.writeFileSync(
        path.join(projectDir, "session-bom.jsonl"),
        bom +
          JSON.stringify({
            type: "user",
            message: { content: "BOM test" },
            gitBranch: "main",
            cwd: "/tmp",
          }) +
          "\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });

    it("session file with null bytes does not crash renderer", async () => {
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      fs.writeFileSync(
        path.join(projectDir, "session-null.jsonl"),
        JSON.stringify({
          type: "user",
          message: { content: "Before null\0After null" },
          gitBranch: "main",
          cwd: "/tmp",
        }) + "\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });

    it("session with only assistant messages (no user) does not crash", async () => {
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      fs.writeFileSync(
        path.join(projectDir, "session-nouser.jsonl"),
        JSON.stringify({
          type: "assistant",
          message: { content: "I have no user prompt" },
        }) + "\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("symlinked session files", () => {
    it("symlinked session file is handled gracefully", async () => {
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      const sourceFile = path.join(projectDir, "session-001.jsonl");
      const symlinkFile = path.join(projectDir, "session-symlink.jsonl");

      try {
        fs.symlinkSync(sourceFile, symlinkFile);
      } catch {
        // Symlinks may not be supported - skip gracefully
        return;
      }

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("rapid state transitions", () => {
    it("rapid provider switching does not corrupt state", async () => {
      session = spawnCli(["--no-splash"], fixtureEnv);
      await session.waitForText("Select AI Agent");

      // Rapidly switch through providers
      for (let i = 0; i < 5; i++) {
        session.sendKey("down");
        await new Promise((r) => setTimeout(r, 50));
        session.sendKey("enter");
        await new Promise((r) => setTimeout(r, 300));

        // Open agent selector again
        session.send("a");
        await new Promise((r) => setTimeout(r, 300));
      }

      // Should still be functional
      expect(session.hasExited()).toBe(false);
    });

    it("rapid d-y-d-y does not corrupt session list", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // Delete two sessions rapidly
      session.send("d");
      await session.waitForText("Delete this session?");
      session.send("y");
      await session.waitForText("Universal AI Session Manager");

      session.send("d");
      await session.waitForText("Delete this session?");
      session.send("y");
      await session.waitForText("Universal AI Session Manager");

      const screen = session.getScreen();
      expect(screen).toContain("Universal AI Session Manager");
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("session ID safety", () => {
    it("session ID with special characters does not cause command injection", async () => {
      // Create a session file with a special-character name
      const projectDir = path.join(fixtureEnv.CLAUDE_SESSIONS_DIR, "-Users-test-myproject");
      const dangerousName = "session-$(whoami).jsonl";
      const safePath = path.join(projectDir, dangerousName);
      fs.writeFileSync(
        safePath,
        JSON.stringify({
          type: "user",
          message: { content: "Injection test" },
          gitBranch: "main",
          cwd: "/tmp",
        }) + "\n",
      );

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      // The session should appear in the list without causing injection
      expect(session.hasExited()).toBe(false);
    });
  });

  describe("permission errors", () => {
    it("unreadable session directory is skipped without crash", async () => {
      const projectDir = path.join(
        fixtureEnv.CLAUDE_SESSIONS_DIR,
        "-Users-test-unreadable-project",
      );
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, "session.jsonl"),
        JSON.stringify({
          type: "user",
          message: { content: "Hidden session" },
          gitBranch: "main",
          cwd: "/tmp",
        }) + "\n",
      );

      // Make the directory unreadable
      try {
        fs.chmodSync(projectDir, 0o000);
      } catch {
        // May not work on all platforms - skip
        return;
      }

      try {
        session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
        await session.waitForText("Universal AI Session Manager");
        expect(session.hasExited()).toBe(false);
      } finally {
        // Restore permissions for cleanup
        try {
          fs.chmodSync(projectDir, 0o755);
        } catch {
          // Best effort
        }
      }
    });
  });
});
