import { describe, it, expect, vi } from "vitest";
import { DeleteSessionUseCase } from "./delete-session.use-case.js";
import type { SessionStoragePort } from "../ports/session-storage.port.js";

describe("DeleteSessionUseCase", () => {
  it("calls storage.delete with the session file path", async () => {
    const mockStorage: SessionStoragePort = { delete: vi.fn().mockResolvedValue(undefined) };
    const useCase = new DeleteSessionUseCase(mockStorage);

    await useCase.execute("/tmp/s1.jsonl");

    expect(mockStorage.delete).toHaveBeenCalledWith("/tmp/s1.jsonl");
  });

  it("throws error when filePath is empty", async () => {
    const mockStorage: SessionStoragePort = { delete: vi.fn() };
    const useCase = new DeleteSessionUseCase(mockStorage);

    await expect(useCase.execute("")).rejects.toThrow();
  });
});
