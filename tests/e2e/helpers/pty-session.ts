import * as pty from "node-pty";
import path from "node:path";
import { stripAnsiCodes } from "./ansi.js";
import type { FixtureEnv } from "./fixture-manager.js";

const CLI_PATH = path.resolve(__dirname, "..", "..", "..", "dist", "cli.js");
const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 30;
const DEFAULT_TIMEOUT = 10_000;

export interface PtySessionOptions {
  args?: string[];
  env?: FixtureEnv & Record<string, string>;
  cols?: number;
  rows?: number;
}

export class PtySession {
  private ptyProcess: pty.IPty;
  private output = "";
  private exitCode: number | null = null;
  private exitPromise: Promise<number>;

  constructor(options: PtySessionOptions = {}) {
    const { args = [], env, cols = DEFAULT_COLS, rows = DEFAULT_ROWS } = options;

    // Build a clean env object: node-pty requires all values to be strings.
    // Exclude CI to prevent Ink from entering CI/buffered mode.
    const cleanEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined && key !== "CI") cleanEnv[key] = value;
    }

    this.ptyProcess = pty.spawn("node", [CLI_PATH, ...args], {
      name: "xterm-256color",
      cols,
      rows,
      cwd: process.cwd(),
      env: {
        ...cleanEnv,
        ...env,
        TERM: "xterm-256color",
      },
    });

    this.ptyProcess.onData((data: string) => {
      this.output += data;
    });

    this.exitPromise = new Promise<number>((resolve) => {
      this.ptyProcess.onExit(({ exitCode }) => {
        this.exitCode = exitCode;
        resolve(exitCode);
      });
    });
  }

  /**
   * Get the full raw output accumulated so far.
   */
  getRawOutput(): string {
    return this.output;
  }

  /**
   * Get ANSI-stripped visible screen text from the latest render frame.
   *
   * Ink re-renders by either:
   * 1. Full clear: \x1b[2J (initial render)
   * 2. Line-by-line erase: repeated \x1b[2K\x1b[1A sequences (subsequent re-renders)
   *
   * The erase block marks the START of a re-render; everything after it is the
   * new frame. We find the last such erase block and return the content after it.
   *
   * Edge case: Ink may write the new frame in multiple data chunks. The erase
   * block always comes as a single burst, so finding the end of the last erase
   * block gives us the correct boundary.
   */
  getScreen(): string {
    const eraseUp = "\x1b[2K\x1b[1A";
    const eraseLine = "\x1b[2K";
    const fullClear = "\x1b[2J";

    // Find the last erase-up block: a contiguous sequence of \x1b[2K\x1b[1A
    // possibly followed by a trailing \x1b[2K. Walk backwards from the end.
    let bestBoundary = -1;

    // Check full screen clear
    const lastClear = this.output.lastIndexOf(fullClear);
    if (lastClear >= 0) {
      bestBoundary = lastClear + fullClear.length;
      // Skip \x1b[3J and \x1b[H that may follow
      if (this.output.startsWith("\x1b[3J", bestBoundary)) {
        bestBoundary += "\x1b[3J".length;
      }
      if (this.output.startsWith("\x1b[H", bestBoundary)) {
        bestBoundary += "\x1b[H".length;
      }
    }

    // Check erase-up blocks (Ink's incremental re-render)
    // Find the LAST erase-up sequence
    const lastEraseUp = this.output.lastIndexOf(eraseUp);
    if (lastEraseUp >= 0) {
      // Walk backwards to find the START of this erase block
      let blockStart = lastEraseUp;
      while (blockStart >= eraseUp.length) {
        const prev = blockStart - eraseUp.length;
        if (this.output.startsWith(eraseUp, prev)) {
          blockStart = prev;
        } else {
          break;
        }
      }

      // Walk forward to find the END of this erase block
      let blockEnd = blockStart;
      while (this.output.startsWith(eraseUp, blockEnd)) {
        blockEnd += eraseUp.length;
      }
      // Trailing \x1b[2K after the block
      if (this.output.startsWith(eraseLine, blockEnd)) {
        blockEnd += eraseLine.length;
      }

      if (blockEnd > bestBoundary) {
        bestBoundary = blockEnd;
      }
    }

    const relevantOutput = bestBoundary >= 0 ? this.output.slice(bestBoundary) : this.output;
    return stripAnsiCodes(relevantOutput);
  }

  /**
   * Get the full accumulated ANSI-stripped output (all frames).
   */
  getFullOutput(): string {
    return stripAnsiCodes(this.output);
  }

  /**
   * Wait until the latest screen frame contains the given text, or timeout.
   */
  async waitForText(text: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (this.getScreen().includes(text)) return;
      await sleep(50);
    }
    const screen = this.getScreen();
    const lastLines = screen.split("\n").slice(-20).join("\n");
    throw new Error(
      `Timed out waiting for "${text}" after ${timeout}ms.\nLast 20 lines of screen:\n${lastLines}`,
    );
  }

  /**
   * Wait until the latest screen frame does NOT contain the given text.
   * Useful for asserting a UI state transition has completed.
   */
  async waitForAbsenceOfText(text: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (!this.getScreen().includes(text)) return;
      await sleep(50);
    }
    throw new Error(`Text "${text}" still present after ${timeout}ms.`);
  }

  /**
   * Wait for the process to exit and return the exit code.
   */
  async waitForExit(timeout = DEFAULT_TIMEOUT): Promise<number> {
    const result = await Promise.race([
      this.exitPromise,
      sleep(timeout).then(() => {
        throw new Error(`Process did not exit within ${timeout}ms`);
      }),
    ]);
    return result;
  }

  /**
   * Check if process has already exited.
   */
  hasExited(): boolean {
    return this.exitCode !== null;
  }

  /**
   * Send a single key or text to the PTY.
   */
  send(data: string): void {
    this.ptyProcess.write(data);
  }

  /**
   * Send a special key by name.
   */
  sendKey(key: SpecialKey): void {
    this.ptyProcess.write(KEY_MAP[key]);
  }

  /**
   * Send a sequence of keys with a delay between each.
   */
  async sendKeys(keys: SpecialKey[], delayMs = 100): Promise<void> {
    for (const key of keys) {
      this.sendKey(key);
      await sleep(delayMs);
    }
  }

  /**
   * Type text characters one at a time with delay.
   */
  async type(text: string, delayMs = 50): Promise<void> {
    for (const char of text) {
      this.send(char);
      await sleep(delayMs);
    }
  }

  /**
   * Resize the PTY terminal.
   */
  resize(cols: number, rows: number): void {
    this.ptyProcess.resize(cols, rows);
  }

  /**
   * Kill the PTY process.
   */
  kill(signal: NodeJS.Signals = "SIGTERM"): void {
    try {
      this.ptyProcess.kill(signal);
    } catch {
      // Process may already be dead
    }
  }

  /**
   * Gracefully close: send 'q' to quit, then kill if needed.
   */
  async close(): Promise<void> {
    if (this.exitCode !== null) return;

    try {
      this.send("q");
      await Promise.race([this.exitPromise, sleep(2000)]);
    } catch {
      // Ignore
    }

    if (this.exitCode === null) {
      this.kill();
      await Promise.race([this.exitPromise, sleep(1000)]).catch(() => {});
    }
  }
}

export type SpecialKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "enter"
  | "escape"
  | "backspace"
  | "delete"
  | "tab"
  | "pageUp"
  | "pageDown"
  | "home"
  | "end"
  | "ctrlC"
  | "ctrlD";

const KEY_MAP: Record<SpecialKey, string> = {
  up: "\x1b[A",
  down: "\x1b[B",
  right: "\x1b[C",
  left: "\x1b[D",
  enter: "\r",
  escape: "\x1b",
  backspace: "\x7f",
  delete: "\x1b[3~",
  tab: "\t",
  pageUp: "\x1b[5~",
  pageDown: "\x1b[6~",
  home: "\x1b[H",
  end: "\x1b[F",
  ctrlC: "\x03",
  ctrlD: "\x04",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convenience: spawn a PtySession with common defaults for E2E tests.
 */
export function spawnCli(
  args: string[],
  fixtureEnv: FixtureEnv,
  options: Partial<PtySessionOptions> = {},
): PtySession {
  return new PtySession({
    args,
    env: { ...fixtureEnv } as FixtureEnv & Record<string, string>,
    ...options,
  });
}
