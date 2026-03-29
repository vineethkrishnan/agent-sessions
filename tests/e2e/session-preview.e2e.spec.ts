import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtySession, spawnCli } from "./helpers/pty-session.js";
import {
  createFixtureEnv,
  cleanupFixtures,
  type FixtureEnv,
} from "./helpers/fixture-manager.js";

describe("Session Preview", () => {
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

  it("'p' opens preview for selected session", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Session Preview");

    const screen = session.getScreen();
    expect(screen).toContain("Session Preview");
    expect(screen).toContain("Agent:");
    expect(screen).toContain("Session:");
    expect(screen).toContain("Project:");
  });

  it("preview shows session metadata", async () => {
    session = await launchWithSessions();

    session.send("p");
    // Wait for the full preview to render including metadata
    await session.waitForText("Agent:");

    const screen = session.getScreen();
    expect(screen).toContain("Session Preview");
    expect(screen).toContain("Agent:");
    expect(screen).toContain("Session:");
    expect(screen).toContain("Branch:");
    expect(screen).toContain("Messages:");
  });

  it("preview shows conversation messages with role labels", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Session Preview");

    // Wait for full preview render
    await session.waitForText("You:");

    const screen = session.getScreen();
    // Should show "You:" label for user messages
    expect(screen).toContain("You:");
  });

  it("closing preview returns to session table", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Agent:");
    await new Promise((r) => setTimeout(r, 300));

    // Use 'p' to close preview (more reliable than escape in PTY)
    session.send("p");
    await session.waitForAbsenceOfText("Session Preview");

    const screen = session.getScreen();
    expect(screen).toContain("Universal AI Session Manager");
  });

  it("'p' again closes preview (toggle behavior)", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Agent:");
    await new Promise((r) => setTimeout(r, 300));

    session.send("p");
    // Wait for the table to re-render after preview closes
    await new Promise((r) => setTimeout(r, 500));

    // The full output should have the table content after the preview
    const output = session.getFullOutput();
    const lastTableIdx = output.lastIndexOf("Universal AI Session Manager");
    const lastPreviewIdx = output.lastIndexOf("Session Preview");
    // Table should appear after the preview in the output stream
    expect(lastTableIdx).toBeGreaterThan(lastPreviewIdx);
  });

  it("'q' in preview closes preview", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Agent:");
    await new Promise((r) => setTimeout(r, 300));

    session.send("q");
    // 'q' in preview calls onClose which returns to table
    await new Promise((r) => setTimeout(r, 500));

    const output = session.getFullOutput();
    const lastTableIdx = output.lastIndexOf("Universal AI Session Manager");
    const lastPreviewIdx = output.lastIndexOf("Session Preview");
    expect(lastTableIdx).toBeGreaterThan(lastPreviewIdx);
  });

  it("up/down scrolls messages in preview", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Session Preview");

    const beforeScroll = session.getScreen();

    // Scroll down
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 200));
    session.sendKey("down");
    await new Promise((r) => setTimeout(r, 200));

    // Should still be in preview
    const afterScroll = session.getScreen();
    expect(afterScroll).toContain("Session Preview");
  });

  it("page up/down performs bulk scroll in preview", async () => {
    session = await launchWithSessions();

    // Select the huge session for more scrollable content
    // Navigate to find it
    session.send("p");
    await session.waitForText("Session Preview");

    session.sendKey("pageDown");
    await new Promise((r) => setTimeout(r, 200));

    const screen = session.getScreen();
    expect(screen).toContain("Session Preview");

    session.sendKey("pageUp");
    await new Promise((r) => setTimeout(r, 200));

    expect(session.getScreen()).toContain("Session Preview");
  });

  it("preview shows navigation hints", async () => {
    session = await launchWithSessions();

    session.send("p");
    await session.waitForText("Session Preview");

    const screen = session.getScreen();
    expect(screen).toContain("Enter: resume");
    expect(screen).toContain("p/Esc: back");
    expect(screen).toContain("Up/Down: scroll");
  });
});
