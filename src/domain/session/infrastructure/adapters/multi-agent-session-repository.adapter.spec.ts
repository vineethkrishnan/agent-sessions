import { describe, it, expect, vi } from "vitest";
import { MultiAgentSessionRepositoryAdapter } from "./multi-agent-session-repository.adapter.js";
import type { SessionProviderPort } from "../../application/ports/session-provider.port.js";

describe("MultiAgentSessionRepositoryAdapter", () => {
  const createMockProvider = (name: string): SessionProviderPort => ({
    name,
    resumeCommand: name.toLowerCase(),
    findAll: vi.fn().mockResolvedValue([]),
    getDetail: vi.fn().mockResolvedValue({}),
  });

  it("lists providers and handles active provider selection", () => {
    const p1 = createMockProvider("Claude");
    const p2 = createMockProvider("Gemini");
    const repo = new MultiAgentSessionRepositoryAdapter([p1, p2]);

    expect(repo.getProviders()).toHaveLength(2);
    expect(repo.getProviders()[0]!.name).toBe("Claude");

    expect(repo.getActiveProvider()).toBeNull(); // Default is "all" (null)

    repo.setActiveProvider("gemini");
    expect(repo.getActiveProvider()?.name).toBe("Gemini");
  });

  it("delegates findAll to appropriate providers", async () => {
    const p1 = createMockProvider("Claude");
    const p2 = createMockProvider("Gemini");
    const repo = new MultiAgentSessionRepositoryAdapter([p1, p2]);

    // Test All (default)
    await repo.findAll();
    expect(p1.findAll).toHaveBeenCalled();
    expect(p2.findAll).toHaveBeenCalled();

    vi.clearAllMocks();

    // Test Single
    repo.setActiveProvider("claude");
    await repo.findAll();
    expect(p1.findAll).toHaveBeenCalled();
    expect(p2.findAll).not.toHaveBeenCalled();
  });

  it("delegates getDetail to specific provider", async () => {
    const p1 = createMockProvider("Claude");
    const repo = new MultiAgentSessionRepositoryAdapter([p1]);

    await repo.getDetail("/tmp/s1.jsonl", "Claude");
    expect(p1.getDetail).toHaveBeenCalledWith("/tmp/s1.jsonl");
  });

  it("throws error when getting detail for non-existent provider", async () => {
    const repo = new MultiAgentSessionRepositoryAdapter([]);
    await expect(repo.getDetail("/tmp/s1.jsonl", "None")).rejects.toThrow(
      "Provider not found: None",
    );
  });
});
