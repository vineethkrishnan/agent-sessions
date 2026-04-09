import { describe, it, expect } from "vitest";
import { ResumeSessionUseCase } from "./resume-session.use-case.js";
import type { ProcessLauncherPort } from "../ports/process-launcher.port.js";
import type { SessionProviderPort } from "../ports/session-provider.port.js";
import { SessionDetail } from "../../domain/session-detail.model.js";

function createMockProvider(name: string): SessionProviderPort {
  return {
    name,
    buildResumeArgs: (sessionId: string) => ({
      command: name.toLowerCase(),
      args: ["--resume", sessionId],
    }),
    findAll: async () => [],
    getDetail: async () =>
      new SessionDetail({ messages: [], totalMessages: 0, cwd: "", gitBranch: "" }),
  };
}

function createMockLauncher(): ProcessLauncherPort & {
  calls: { command: string; args: string[] }[];
} {
  const calls: { command: string; args: string[] }[] = [];
  return {
    calls,
    launch(command: string, args: string[]) {
      calls.push({ command, args });
    },
  };
}

describe("ResumeSessionUseCase", () => {
  const providers = [createMockProvider("Claude"), createMockProvider("Gemini")];

  it("execute launches the correct provider command", () => {
    const launcher = createMockLauncher();
    const useCase = new ResumeSessionUseCase(launcher, providers);

    useCase.execute("session-123", "Claude");

    expect(launcher.calls).toHaveLength(1);
    expect(launcher.calls[0]).toEqual({
      command: "claude",
      args: ["--resume", "session-123"],
    });
  });

  it("execute throws for unknown provider", () => {
    const launcher = createMockLauncher();
    const useCase = new ResumeSessionUseCase(launcher, providers);

    expect(() => useCase.execute("session-123", "Unknown")).toThrowError(
      "Provider not found: Unknown",
    );
  });

  it("execute matches provider case-insensitively", () => {
    const launcher = createMockLauncher();
    const useCase = new ResumeSessionUseCase(launcher, providers);

    useCase.execute("session-456", "gemini");

    expect(launcher.calls).toHaveLength(1);
    expect(launcher.calls[0]!.command).toBe("gemini");
  });

  it("buildResumeArgs returns args for valid provider", () => {
    const launcher = createMockLauncher();
    const useCase = new ResumeSessionUseCase(launcher, providers);

    const result = useCase.buildResumeArgs("session-789", "Claude");

    expect(result).toEqual({
      command: "claude",
      args: ["--resume", "session-789"],
    });
  });

  it("buildResumeArgs returns null for unknown provider", () => {
    const launcher = createMockLauncher();
    const useCase = new ResumeSessionUseCase(launcher, providers);

    const result = useCase.buildResumeArgs("session-789", "Nonexistent");

    expect(result).toBeNull();
  });
});
