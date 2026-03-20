export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = "SessionNotFoundError";
  }
}

export class SessionParseError extends Error {
  constructor(filePath: string, cause?: unknown) {
    super(`Failed to parse session: ${filePath}`);
    this.name = "SessionParseError";
    this.cause = cause;
  }
}
