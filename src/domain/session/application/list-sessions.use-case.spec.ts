import { describe, it, expect } from "vitest";
import { ListSessionsUseCase } from "./list-sessions.use-case.js";
import { Session } from "../domain/session.model.js";
import type { SessionRepositoryPort } from "./ports/session-repository.port.js";

function makeSession(id: string, project: string, branch = "main") {
  return new Session({
    id,
    filePath: `/tmp/${id}.jsonl`,
    project,
    gitBranch: branch,
    messageCount: 3,
    preview: `Working on ${project}`,
    modifiedAt: new Date(),
    cwd: `/home/user/${project}`,
  });
}

function createMockRepo(sessions: Session[]): SessionRepositoryPort {
  return { findAll: () => sessions };
}

describe("ListSessionsUseCase", () => {
  const sessions = [
    makeSession("s1", "~/projects/app-a", "feat/auth"),
    makeSession("s2", "~/projects/app-b", "main"),
    makeSession("s3", "~/projects/app-c", "fix/bug"),
  ];

  it("returns all sessions when no filter", () => {
    const useCase = new ListSessionsUseCase(createMockRepo(sessions));
    expect(useCase.execute()).toHaveLength(3);
  });

  it("filters sessions by project name", () => {
    const useCase = new ListSessionsUseCase(createMockRepo(sessions));
    const result = useCase.execute("app-a");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("s1");
  });

  it("filters sessions by branch name", () => {
    const useCase = new ListSessionsUseCase(createMockRepo(sessions));
    expect(useCase.execute("feat/auth")).toHaveLength(1);
  });

  it("returns empty array when nothing matches", () => {
    const useCase = new ListSessionsUseCase(createMockRepo(sessions));
    expect(useCase.execute("nonexistent")).toHaveLength(0);
  });

  it("returns all sessions with empty string filter", () => {
    const useCase = new ListSessionsUseCase(createMockRepo(sessions));
    expect(useCase.execute("")).toHaveLength(3);
  });
});
