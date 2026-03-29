import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("Agent Selector", () => {
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

  it("shows agent selector on fresh launch without --agent flag", async () => {
    session = spawnCli(["--no-splash"], fixtureEnv);
    await session.waitForText("Select AI Agent");

    const screen = session.getScreen();
    expect(screen).toContain("Select AI Agent");
  });

  it("lists all registered providers", async () => {
    session = spawnCli(["--no-splash"], fixtureEnv);
    await session.waitForText("Select AI Agent");

    const screen = session.getScreen();
    expect(screen).toContain("All Agents");
    expect(screen).toContain("Claude");
    expect(screen).toContain("Cursor");
    expect(screen).toContain("Gemini");
    expect(screen).toContain("OpenAI");
  });

  it("shows navigation hints in the selector", async () => {
    session = spawnCli(["--no-splash"], fixtureEnv);
    await session.waitForText("Select AI Agent");

    const screen = session.getScreen();
    expect(screen).toContain("navigate");
    expect(screen).toContain("Enter");
  });

  it("arrow keys navigate the provider list", async () => {
    session = spawnCli(["--no-splash"], fixtureEnv);
    await session.waitForText("Select AI Agent");

    // The selector indicator should be present
    const screen = session.getScreen();
    expect(screen).toContain("❯");

    // Move down
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 200));

    // Indicator should still be visible (moved to next item)
    const afterDown = session.getScreen();
    expect(afterDown).toContain("❯");
  });

  it("enter selects provider and loads sessions", async () => {
    session = spawnCli(["--no-splash"], fixtureEnv);
    await session.waitForText("Select AI Agent");

    // Navigate to Claude (should be second item after "All Agents")
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 150));
    session.sendKey("enter");

    // Should transition to session table
    await session.waitForAbsenceOfText("Select AI Agent");
    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("selecting 'All Agents' shows sessions from all providers", async () => {
    session = spawnCli(["--no-splash"], fixtureEnv);
    await session.waitForText("Select AI Agent");

    // "All Agents" should be the first item (already selected)
    session.sendKey("enter");

    await session.waitForText("Universal AI Session Manager");
    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("'a' key reopens agent selector from session table", async () => {
    session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
    await session.waitForText("Universal AI Session Manager");

    // Press 'a' to open agent selector
    session.send("a");
    await session.waitForText("Select AI Agent");

    const screen = session.getScreen();
    expect(screen).toContain("Select AI Agent");
    expect(screen).toContain("Claude");
  });

  it("escape closes selector without changing agent", async () => {
    session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
    await session.waitForText("Universal AI Session Manager");

    // Open agent selector
    session.send("a");
    await session.waitForText("Select AI Agent");

    // Press escape to close without changing
    session.sendKey("escape");
    await session.waitForAbsenceOfText("Select AI Agent");

    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("switching agent resets search filter", async () => {
    session = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
    await session.waitForText("Universal AI Session Manager");

    // Enter search mode and type a filter
    session.send("/");
    await session.waitForText("Filter:");
    await session.type("login");
    await new Promise((r) => setTimeout(r, 200));

    // Confirm filter is active
    expect(session.getScreen()).toContain("login");

    // Exit search mode
    session.sendKey("enter");
    await new Promise((r) => setTimeout(r, 200));

    // Open agent selector and switch
    session.send("a");
    await session.waitForText("Select AI Agent");
    session.sendKey("enter"); // Select "All Agents"
    await session.waitForAbsenceOfText("Select AI Agent");

    // Filter should be reset - the screen should not show "login" as filter text
    const screen = session.getScreen();
    expect(screen).not.toContain("Filter:");
  });
});
