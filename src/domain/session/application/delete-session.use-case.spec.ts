import { describe, it, expect, vi } from "vitest";
import { DeleteSessionUseCase } from "./delete-session.use-case.js";
import { Session } from "../domain/session.model.js";
import type { SessionStoragePort } from "./ports/session-storage.port.js";

function makeSession(id: string, filePath: string) {
  return new Session({
    id,
    filePath,
    project: "~/test",
    gitBranch: "main",
    messageCount: 1,
    preview: "test",
    modifiedAt: new Date(),
    cwd: "/tmp",
  });
}

describe("DeleteSessionUseCase", () => {
  it("calls storage.delete with the session file path", () => {
    const mockStorage: SessionStoragePort = { delete: vi.fn() };
    const useCase = new DeleteSessionUseCase(mockStorage);

    useCase.execute(makeSession("s1", "/tmp/s1.jsonl"));

    expect(mockStorage.delete).toHaveBeenCalledWith("/tmp/s1.jsonl");
  });

  it("throws SessionNotFoundError when filePath is empty", () => {
    const mockStorage: SessionStoragePort = { delete: vi.fn() };
    const useCase = new DeleteSessionUseCase(mockStorage);

    expect(() => useCase.execute(makeSession("s1", ""))).toThrow("Session not found: s1");
  });
});
