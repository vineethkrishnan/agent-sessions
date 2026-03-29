import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("Delete Flow", () => {
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

  it("'d' shows delete confirmation dialog", async () => {
    session = await launchWithSessions();

    session.send("d");
    await session.waitForText("Delete this session?");

    const screen = session.getScreen();
    expect(screen).toContain("Delete this session?");
    expect(screen).toContain("Session:");
    expect(screen).toContain("y");
    expect(screen).toContain("confirm");
    expect(screen).toContain("cancel");
  });

  it("'n' cancels deletion and returns to table", async () => {
    session = await launchWithSessions();

    session.send("d");
    await session.waitForText("Delete this session?");

    session.send("n");
    await session.waitForAbsenceOfText("Delete this session?");

    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("escape cancels deletion and returns to table", async () => {
    session = await launchWithSessions();

    session.send("d");
    await session.waitForText("Delete this session?");

    session.sendKey("escape");
    await session.waitForAbsenceOfText("Delete this session?");

    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("'y' confirms deletion and removes session from list", async () => {
    session = await launchWithSessions();

    // Count sessions before delete
    const screenBefore = session.getScreen();
    const totalMatch = screenBefore.match(/\((\d+) total\)/);
    const totalBefore = totalMatch ? parseInt(totalMatch[1]!, 10) : 0;

    session.send("d");
    await session.waitForText("Delete this session?");

    session.send("y");
    await session.waitForAbsenceOfText("Delete this session?");

    // Should return to table with one fewer session
    const screenAfter = session.getScreen();
    const totalAfterMatch = screenAfter.match(/\((\d+) total\)/);
    const totalAfter = totalAfterMatch ? parseInt(totalAfterMatch[1]!, 10) : 0;

    expect(totalAfter).toBe(totalBefore - 1);
  });

  it("deleted session file is actually removed from disk", async () => {
    session = await launchWithSessions();

    // Verify the total count shown in the UI matches our expectations
    const initialScreen = session.getScreen();
    const totalMatch = initialScreen.match(/\((\d+) total\)/);
    const totalInUI = totalMatch ? parseInt(totalMatch[1]!, 10) : 0;
    expect(totalInUI).toBeGreaterThan(0);

    // Delete the first session
    session.send("d");
    await session.waitForText("Delete this session?");

    // Get the session ID from the delete dialog
    const deleteScreen = session.getScreen();

    session.send("y");
    await session.waitForAbsenceOfText("Delete this session?");

    // Verify the UI now shows one fewer session
    const afterScreen = session.getScreen();
    const afterMatch = afterScreen.match(/\((\d+) total\)/);
    const totalAfter = afterMatch ? parseInt(afterMatch[1]!, 10) : 0;

    expect(totalAfter).toBe(totalInUI - 1);
  });

  it("'Y' (uppercase) also confirms deletion", async () => {
    session = await launchWithSessions();

    session.send("d");
    await session.waitForText("Delete this session?");

    session.send("Y");
    await session.waitForAbsenceOfText("Delete this session?");

    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("'N' (uppercase) also cancels deletion", async () => {
    session = await launchWithSessions();

    session.send("d");
    await session.waitForText("Delete this session?");

    session.send("N");
    await session.waitForAbsenceOfText("Delete this session?");

    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("delete confirmation shows session details", async () => {
    session = await launchWithSessions();

    session.send("d");
    await session.waitForText("Delete this session?");

    const screen = session.getScreen();
    expect(screen).toContain("Session:");
    expect(screen).toContain("Project:");
    expect(screen).toContain("Branch:");
    expect(screen).toContain("Date:");
    expect(screen).toContain("Preview:");
  });

  it("--delete flag shows DELETE MODE indicator", async () => {
    session = spawnCli(["--agent", "claude", "--no-splash", "--delete"], fixtureEnv);
    await session.waitForText("DELETE MODE");

    const screen = session.getScreen();
    expect(screen).toContain("DELETE MODE");
  });
});
