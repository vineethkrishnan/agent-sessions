import { describe, it, expect, vi } from "vitest";
import { GetSessionDetailUseCase } from "./get-session-detail.use-case.js";
import { SessionDetail } from "../../domain/session-detail.model.js";
import type { SessionRepositoryPort } from "../ports/session-repository.port.js";

describe("GetSessionDetailUseCase", () => {
  it("calls repository.getDetail with the session filePath and providerName", async () => {
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
      getDetail: vi.fn().mockResolvedValue(expectedDetail),
    };

    const useCase = new GetSessionDetailUseCase(mockRepo);
    const result = await useCase.execute("/tmp/s1.jsonl", "Claude");

    expect(mockRepo.getDetail).toHaveBeenCalledWith("/tmp/s1.jsonl", "Claude");
    expect(result).toBe(expectedDetail);
    expect(result.messages).toHaveLength(2);
  });
});
