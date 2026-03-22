import { describe, it, expect, vi } from "vitest";
import { GetSessionDetailUseCase } from "./get-session-detail.use-case.js";
import { Session } from "../domain/session.model.js";
import { SessionDetail } from "../domain/session-detail.model.js";
import type { SessionRepositoryPort } from "./ports/session-repository.port.js";

function makeSession(filePath: string) {
  return new Session({
    id: "s1",
    filePath,
    project: "~/test",
    gitBranch: "main",
    messageCount: 4,
    preview: "test",
    modifiedAt: new Date(),
    cwd: "/tmp",
  });
}

describe("GetSessionDetailUseCase", () => {
  it("calls repository.getDetail with the session filePath", () => {
    const expectedDetail = new SessionDetail({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ],
      totalMessages: 2,
      cwd: "/tmp",
      gitBranch: "main",
    });

    const mockRepo: SessionRepositoryPort = {
      findAll: vi.fn(),
      getDetail: vi.fn().mockReturnValue(expectedDetail),
    };

    const useCase = new GetSessionDetailUseCase(mockRepo);
    const result = useCase.execute(makeSession("/tmp/s1.jsonl"));

    expect(mockRepo.getDetail).toHaveBeenCalledWith("/tmp/s1.jsonl");
    expect(result).toBe(expectedDetail);
    expect(result.loadedMessages).toBe(2);
  });
});
