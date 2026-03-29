import { ListSessionsUseCase } from "./application/use-cases/list-sessions.use-case.js";
import { GetSessionDetailUseCase } from "./application/use-cases/get-session-detail.use-case.js";
import { ResumeSessionUseCase } from "./application/use-cases/resume-session.use-case.js";
import { DeleteSessionUseCase } from "./application/use-cases/delete-session.use-case.js";
import { MultiAgentSessionRepositoryAdapter } from "./infrastructure/adapters/multi-agent-session-repository.adapter.js";
import { CliProcessLauncherAdapter } from "./infrastructure/adapters/cli-process-launcher.adapter.js";
import { FsSessionStorageAdapter } from "./infrastructure/adapters/fs-session-storage.adapter.js";
import { ClaudeSessionProvider } from "./infrastructure/providers/claude/claude-session.provider.js";
import { CursorSessionProvider } from "./infrastructure/providers/cursor/cursor-session.provider.js";
import { GeminiSessionProvider } from "./infrastructure/providers/gemini/gemini-session.provider.js";
import { OpenAICodexProvider } from "./infrastructure/providers/openai/openai-codex.provider.js";

export function createSessionModule() {
  const providers = [
    new ClaudeSessionProvider(),
    new CursorSessionProvider(),
    new GeminiSessionProvider(),
    new OpenAICodexProvider(),
  ];

  const repository = new MultiAgentSessionRepositoryAdapter(providers);
  const launcher = new CliProcessLauncherAdapter();
  const storage = new FsSessionStorageAdapter();

  return {
    listSessionsUseCase: new ListSessionsUseCase(repository),
    getSessionDetailUseCase: new GetSessionDetailUseCase(repository),
    resumeSessionUseCase: new ResumeSessionUseCase(launcher, providers),
    deleteSessionUseCase: new DeleteSessionUseCase(storage),
    multiAgentRepository: repository,
  };
}

export type SessionModule = ReturnType<typeof createSessionModule>;
