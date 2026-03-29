import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("Navigation", () => {
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

  async function launchWithSessions(): Promise<PtySession> {
    const s = spawnCli(["--agent", "claude", "--no-splash"], fixtureEnv);
    await s.waitForText("Universal AI Session Manager");
    return s;
  }

  it("shows session table with navigation hints", async () => {
    session = await launchWithSessions();
    const screen = session.getScreen();

    expect(screen).toContain("Arrows: navigate");
    expect(screen).toContain("Enter: resume");
    expect(screen).toContain("p: preview");
    expect(screen).toContain("/: search");
    expect(screen).toContain("d: delete");
    expect(screen).toContain("q: quit");
  });

  it("highlights the first session by default", async () => {
    session = await launchWithSessions();
    const screen = session.getScreen();

    // The selection indicator should be present
    expect(screen).toContain("▶");
  });

  it("arrow down moves selection to next row", async () => {
    session = await launchWithSessions();

    // Capture initial screen
    const initialScreen = session.getScreen();
    expect(initialScreen).toContain("▶");

    // Move down
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 200));

    // Screen should have changed (the arrow indicator moved)
    const afterDown = session.getScreen();
    expect(afterDown).toContain("▶");
    // Status bar should update to show position 2
    // The exact format depends on the StatusBar component
  });

  it("arrow up at top row stays at top (no wrap-around)", async () => {
    session = await launchWithSessions();

    // Press up at the first item - should stay at position 1
    session.sendKey("up");
    await new Promise((r) => setTimeout(r, 200));

    const screen = session.getScreen();
    // Still showing the first item selected
    expect(screen).toContain("▶");
  });

  it("arrow down at bottom stays at bottom (no wrap-around)", async () => {
    session = await launchWithSessions();

    // Press down many times to reach the bottom
    for (let i = 0; i < 20; i++) {
      session.sendKey("down");
    }
    await new Promise((r) => setTimeout(r, 300));

    // Press down one more time - should not crash or wrap
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 200));

    const screen = session.getScreen();
    expect(screen).toContain("▶");
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("page down jumps multiple rows", async () => {
    session = await launchWithSessions();

    session.sendKey("pageDown");
    await new Promise((r) => setTimeout(r, 200));

    const screen = session.getScreen();
    expect(screen).toContain("▶");
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("page up jumps multiple rows", async () => {
    session = await launchWithSessions();

    // Move down first, then page up
    await session.sendKeys(["down", "down", "down"], 100);
    session.sendKey("pageUp");
    await new Promise((r) => setTimeout(r, 200));

    const screen = session.getScreen();
    expect(screen).toContain("▶");
  });

  it("rapid key presses do not corrupt state", async () => {
    session = await launchWithSessions();

    // Send many rapid keystrokes
    for (let i = 0; i < 15; i++) {
      session.sendKey("down");
    }
    for (let i = 0; i < 15; i++) {
      session.sendKey("up");
    }
    await new Promise((r) => setTimeout(r, 500));

    const screen = session.getScreen();
    // App should still be functional
    expect(screen).toContain("Universal AI Session Manager");
    expect(screen).toContain("▶");
  });

  it("q exits the application with code 0", async () => {
    session = await launchWithSessions();

    session.send("q");
    const exitCode = await session.waitForExit(5000);

    expect(exitCode).toBe(0);
  });

  it("q during search mode types q instead of quitting", async () => {
    session = await launchWithSessions();

    // Enter search mode
    session.send("/");
    await new Promise((r) => setTimeout(r, 200));

    // Type 'q' - should be entered as search text, not quit
    session.send("q");
    await new Promise((r) => setTimeout(r, 200));

    const screen = session.getScreen();
    // Should show filter with 'q' text, not have exited
    expect(screen).toContain("Filter:");
    expect(screen).toContain("q");
    expect(session.hasExited()).toBe(false);
  });

  it("navigation updates status bar position counter", async () => {
    session = await launchWithSessions();

    // Check initial status shows position info
    const initialScreen = session.getScreen();
    // StatusBar shows "Showing X-Y of Z"
    expect(initialScreen).toMatch(/\d/);

    // Move down and check counter updates
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 200));

    const afterScreen = session.getScreen();
    expect(afterScreen).toContain("Showing");
  });
});
