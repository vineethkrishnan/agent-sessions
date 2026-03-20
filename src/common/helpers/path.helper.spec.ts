import { describe, it, expect, vi } from "vitest";
import { decodeProjectPath } from "./path.helper.js";

vi.mock("node:os", () => ({
  default: {
    userInfo: () => ({ username: "vineeth" }),
  },
}));

describe("decodeProjectPath", () => {
  it("decodes a standard project path", () => {
    expect(decodeProjectPath("-Users-vineeth-projects-my-app")).toBe("~/projects/my/app");
  });

  it("decodes a nested project path", () => {
    expect(decodeProjectPath("-Users-vineeth-projects-org-repo")).toBe("~/projects/org/repo");
  });

  it("returns raw string for non-matching prefix", () => {
    expect(decodeProjectPath("-Users-otheruser-code")).toBe("-Users-otheruser-code");
  });

  it("handles home directory root", () => {
    expect(decodeProjectPath("-Users-vineeth-Desktop")).toBe("~/Desktop");
  });
});
