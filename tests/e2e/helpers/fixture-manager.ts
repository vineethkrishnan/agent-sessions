import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

export interface FixtureEnv {
  CLAUDE_SESSIONS_DIR: string;
  CURSOR_SESSIONS_DIR: string;
  GEMINI_TMP_DIR: string;
  CODEX_SESSIONS_DIR: string;
}

/**
 * Copy all fixture directories to a temp location and return env vars
 * pointing to them. Each test gets its own isolated copy.
 */
export function createFixtureEnv(): { env: FixtureEnv; tmpRoot: string } {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-sessions-e2e-"));

  const claudeDir = path.join(tmpRoot, "claude");
  const cursorDir = path.join(tmpRoot, "cursor");
  const geminiDir = path.join(tmpRoot, "gemini");
  const openaiDir = path.join(tmpRoot, "openai");

  copyDirRecursive(path.join(FIXTURES_DIR, "claude"), claudeDir);
  copyDirRecursive(path.join(FIXTURES_DIR, "cursor"), cursorDir);
  copyDirRecursive(path.join(FIXTURES_DIR, "gemini"), geminiDir);
  copyDirRecursive(path.join(FIXTURES_DIR, "openai"), openaiDir);

  return {
    env: {
      CLAUDE_SESSIONS_DIR: claudeDir,
      CURSOR_SESSIONS_DIR: cursorDir,
      GEMINI_TMP_DIR: geminiDir,
      CODEX_SESSIONS_DIR: openaiDir,
    },
    tmpRoot,
  };
}

/**
 * Create a fixture env with only empty provider directories (no sessions).
 */
export function createEmptyFixtureEnv(): { env: FixtureEnv; tmpRoot: string } {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-sessions-e2e-empty-"));

  const claudeDir = path.join(tmpRoot, "claude");
  const cursorDir = path.join(tmpRoot, "cursor");
  const geminiDir = path.join(tmpRoot, "gemini");
  const openaiDir = path.join(tmpRoot, "openai");

  fs.mkdirSync(claudeDir, { recursive: true });
  fs.mkdirSync(cursorDir, { recursive: true });
  fs.mkdirSync(geminiDir, { recursive: true });
  fs.mkdirSync(openaiDir, { recursive: true });

  return {
    env: {
      CLAUDE_SESSIONS_DIR: claudeDir,
      CURSOR_SESSIONS_DIR: cursorDir,
      GEMINI_TMP_DIR: geminiDir,
      CODEX_SESSIONS_DIR: openaiDir,
    },
    tmpRoot,
  };
}

/**
 * Remove the temp fixture directory.
 */
export function cleanupFixtures(tmpRoot: string): void {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  if (!fs.existsSync(src)) return;

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
