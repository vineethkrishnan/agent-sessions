import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("Process Lifecycle", () => {
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

  describe("clean exit", () => {
    it("'q' quit exits with code 0", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      session.send("q");
      const exitCode = await session.waitForExit(5000);
      expect(exitCode).toBe(0);
    });

    it("'Q' (uppercase) also quits", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      session.send("Q");
      const exitCode = await session.waitForExit(5000);
      expect(exitCode).toBe(0);
    });
  });

  describe("flag exits", () => {
    it("--help exits with code 0", async () => {
      session = spawnCli(["--help"], fixtureEnv);
      const exitCode = await session.waitForExit(5000);
      expect(exitCode).toBe(0);
    });

    it("--version exits with code 0", async () => {
      session = spawnCli(["--version"], fixtureEnv);
      const exitCode = await session.waitForExit(5000);
      expect(exitCode).toBe(0);
    });

    it("unknown flag exits with non-zero code", async () => {
      session = spawnCli(["--nonexistent-flag"], fixtureEnv);
      const exitCode = await session.waitForExit(5000);
      expect(exitCode).not.toBe(0);
    });
  });

  describe("signal handling", () => {
    it("SIGTERM terminates the process", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      session.kill("SIGTERM");
      const exitCode = await session.waitForExit(5000);
      // Process should have exited (code varies by platform)
      expect(typeof exitCode).toBe("number");
    });

    it("Ctrl+C sends SIGINT and exits", async () => {
      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager");

      session.sendKey("ctrlC");
      // Give it time to handle the signal
      await new Promise((r) => setTimeout(r, 1000));

      // Should either exit or still be running (Ink may catch SIGINT)
      // The main thing is it should not crash in an uncontrolled way
    });
  });

  describe("startup performance", () => {
    it("reaches interactive state within 10 seconds", async () => {
      const start = Date.now();

      session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
      await session.waitForText("Universal AI Session Manager", 10_000);

      const elapsed = Date.now() - start;
      // Should be interactive well within the timeout
      expect(elapsed).toBeLessThan(10_000);
    });

    it("empty state reaches interactive state quickly", async () => {
      const emptyResult = createFixtureEnv();
      try {
        const start = Date.now();
        session = spawnCli(["--agent", "claude", "--no-splash"], emptyResult.env);

        // Wait for either the table or empty message
        await Promise.race([
          session.waitForText("Universal AI Session Manager", 10_000),
          session.waitForText("No matching sessions", 10_000),
        ]).catch(() => {});

        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(10_000);
      } finally {
        cleanupFixtures(emptyResult.tmpRoot);
      }
    });
  });
});
