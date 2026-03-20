import os from "node:os";

/**
 * Decode a Claude projects directory name back to a readable path.
 * e.g. "-Users-vineeth-projects-foo" → "~/projects/foo"
 */
export function decodeProjectPath(dirName: string): string {
  const username = os.userInfo().username;
  const homePrefix = `-Users-${username}-`;

  if (dirName.startsWith(homePrefix)) {
    const rest = dirName.slice(homePrefix.length);
    return `~/${rest.replace(/-/g, "/")}`;
  }

  return dirName;
}
