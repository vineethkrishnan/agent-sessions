import type { ProcessLauncherPort } from "./ports/process-launcher.port.js";

export class ResumeSessionUseCase {
  constructor(private readonly launcher: ProcessLauncherPort) {}

  execute(sessionId: string): void {
    this.launcher.launch("claude", ["--resume", sessionId]);
  }
}
