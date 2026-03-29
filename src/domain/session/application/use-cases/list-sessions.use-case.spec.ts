import { describe, it, expect } from "vitest";
import { ListSessionsUseCase } from "./list-sessions.use-case.js";
import { Session } from "../../domain/session.model.js";
import type { SessionRepositoryPort } from "../ports/session-repository.port.js";

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
    provider: "Claude",
  });
}

function createMockRepo(sessions: Session[]): SessionRepositoryPort {
  return {
    findAll: async () => sessions,
    getDetail: async () => null!,
  };
}

describe("ListSessionsUseCase", () => {
  const sessions = [
    makeSession("s1", "~/projects/app-a", "feat/auth"),
    makeSession("s2", "~/projects/app-b", "main"),
    makeSession("s3", "~/projects/app-c", "fix/bug"),
  ];

  it("returns all sessions", async () => {
    const useCase = new ListSessionsUseCase(createMockRepo(sessions));
    const result = await useCase.execute();
    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe("s1");
  });
});
