import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  createEmptyFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("CLI Flags", () => {
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

  describe("--help", () => {
    it("shows usage information and exits with code 0", async () => {
      session = spawnCli(["--help"], fixtureEnv);
      const exitCode = await session.waitForExit();

      expect(exitCode).toBe(0);
      const screen = session.getScreen();
      expect(screen).toContain("agent-sessions");
      expect(screen).toContain("--help");
      expect(screen).toContain("--version");
    });
  });

  describe("--version", () => {
    it("prints version number and exits with code 0", async () => {
      session = spawnCli(["--version"], fixtureEnv);
      const exitCode = await session.waitForExit();

      expect(exitCode).toBe(0);
      const screen = session.getScreen();
      // Version should match semver pattern
      expect(screen).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe("--agent", () => {
    it("skips agent selector and shows sessions for specified agent", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);

      // Should skip agent selector and go directly to session table
      await session.waitForText("Universal AI Session Manager");
      const screen = session.getScreen();

      // Should not show agent selector
      expect(screen).not.toContain("Select AI Agent");
      // Should show sessions
      expect(screen).toContain("session");
    });

    it("handles unknown agent name gracefully without crashing", async () => {
      session = spawnCli(["--agent", "nonexistent", "--no-splash"], fixtureEnv);

      // The app catches the error and still renders the session table
      // It may show all sessions or an empty state, but should not crash
      await session.waitForText("Universal AI Session Manager", 5000).catch(() => {
        // May still be loading or showing error
      });

      // App should not have crashed
      expect(session.hasExited()).toBe(false);

      // Verify we can still interact with the app
      session.send("q");
      const exitCode = await session.waitForExit(5000);
      expect(exitCode).toBe(0);
    });
  });

  describe("--no-splash", () => {
    it("skips splash screen and goes directly to agent selector", async () => {
      session = spawnCli(["--no-splash"], fixtureEnv);

      // Without --agent, should show agent selector directly (no splash)
      await session.waitForText("Select AI Agent");
      const screen = session.getScreen();
      expect(screen).toContain("Select AI Agent");
    });
  });

  describe("--delete", () => {
    it("enables delete mode with visual indicator", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash", "--delete"], fixtureEnv);

      await session.waitForText("DELETE MODE");
      const screen = session.getScreen();
      expect(screen).toContain("DELETE MODE");
    });
  });

  describe("flag combinations", () => {
    it("--agent claude --no-splash --delete combines correctly", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash", "--delete"], fixtureEnv);

      await session.waitForText("DELETE MODE");
      await session.waitForText("Universal AI Session Manager");

      const screen = session.getScreen();
      // All flags applied: no splash, no agent selector, delete mode active
      expect(screen).toContain("DELETE MODE");
      expect(screen).toContain("Universal AI Session Manager");
      expect(screen).not.toContain("Select AI Agent");
    });

    it("--agent with --no-splash shows sessions immediately", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);

      await session.waitForText("Universal AI Session Manager");
      // Should see session data (not splash, not agent selector)
      const screen = session.getScreen();
      expect(screen).not.toContain("Select AI Agent");
    });
  });

  describe("unknown flags", () => {
    it("shows error for unrecognized flags", async () => {
      session = spawnCli(["--bogus-flag"], fixtureEnv);
      const exitCode = await session.waitForExit(5000);

      expect(exitCode).not.toBe(0);
      const screen = session.getScreen();
      expect(screen).toContain("unknown option");
    });
  });

  describe("empty state", () => {
    it("shows agent selector even with no sessions", async () => {
      const emptyResult = createEmptyFixtureEnv();
      try {
        session = spawnCli(["--no-splash"], emptyResult.env);
        await session.waitForText("Select AI Agent");
        expect(session.getScreen()).toContain("Select AI Agent");
      } finally {
        cleanupFixtures(emptyResult.tmpRoot);
      }
    });
  });
});
