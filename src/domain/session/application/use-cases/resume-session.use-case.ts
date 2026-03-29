import type { ProcessLauncherPort } from "../ports/process-launcher.port.js";
import type { SessionProviderPort } from "../ports/session-provider.port.js";

export class ResumeSessionUseCase {
  constructor(
    private readonly launcher: ProcessLauncherPort,
    private readonly providers: SessionProviderPort[],
  ) {}

  execute(sessionId: string, providerName: string): void {
    const provider = this.providers.find((candidate) => candidate.name === providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    const { command, args } = provider.buildResumeArgs(sessionId);
    this.launcher.launch(command, args);
  }
}
