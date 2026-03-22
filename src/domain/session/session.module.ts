import { FsSessionRepositoryAdapter } from "./infrastructure/fs-session-repository.adapter.js";
import { FsSessionStorageAdapter } from "./infrastructure/fs-session-storage.adapter.js";
import { CliProcessLauncherAdapter } from "./infrastructure/cli-process-launcher.adapter.js";
import { ListSessionsUseCase } from "./application/list-sessions.use-case.js";
import { DeleteSessionUseCase } from "./application/delete-session.use-case.js";
import { ResumeSessionUseCase } from "./application/resume-session.use-case.js";
import { GetSessionDetailUseCase } from "./application/get-session-detail.use-case.js";

export interface SessionModule {
  listSessionsUseCase: ListSessionsUseCase;
  deleteSessionUseCase: DeleteSessionUseCase;
  resumeSessionUseCase: ResumeSessionUseCase;
  getSessionDetailUseCase: GetSessionDetailUseCase;
}

export function createSessionModule(): SessionModule {
  const sessionRepository = new FsSessionRepositoryAdapter();
  const sessionStorage = new FsSessionStorageAdapter();
  const processLauncher = new CliProcessLauncherAdapter();

  return {
    listSessionsUseCase: new ListSessionsUseCase(sessionRepository),
    deleteSessionUseCase: new DeleteSessionUseCase(sessionStorage),
    resumeSessionUseCase: new ResumeSessionUseCase(processLauncher),
    getSessionDetailUseCase: new GetSessionDetailUseCase(sessionRepository),
  };
}
