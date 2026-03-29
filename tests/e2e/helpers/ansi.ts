import stripAnsi from "strip-ansi";

/**
 * Strip all ANSI escape codes and return plain visible text.
 */
export function stripAnsiCodes(text: string): string {
  return stripAnsi(text);
}

/**
 * Get visible text lines from raw PTY output, filtering out empty lines.
 */
export function getVisibleLines(rawOutput: string): string[] {
  return stripAnsiCodes(rawOutput)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

/**
 * Check if visible text contains a substring (case-insensitive optional).
 */
export function screenContains(
  rawOutput: string,
  text: string,
  options: { caseInsensitive?: boolean } = {},
): boolean {
  const screen = stripAnsiCodes(rawOutput);
  if (options.caseInsensitive) {
    return screen.toLowerCase().includes(text.toLowerCase());
  }
  return screen.includes(text);
}
