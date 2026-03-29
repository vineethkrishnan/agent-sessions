import { describe, it, expect } from "vitest";
import { truncate, padRight, formatDate, separatorWidth, COLUMNS } from "./table-formatter.js";

describe("truncate", () => {
  it("returns string unchanged when shorter", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates with ellipsis when longer", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("padRight", () => {
  it("pads to specified length", () => {
    expect(padRight("hi", 5)).toBe("hi   ");
  });

  it("truncates when exceeding length", () => {
    expect(padRight("hello world", 5)).toBe("hello");
  });
});

describe("formatDate", () => {
  it("formats with zero-padded values", () => {
    const date = new Date(2026, 0, 5, 3, 7);
    expect(formatDate(date)).toBe("2026-01-05 03:07");
  });
});

describe("separatorWidth", () => {
  it("equals sum of all columns plus separators", () => {
    const expected =
      COLUMNS.date +
      COLUMNS.provider +
      COLUMNS.project +
      COLUMNS.branch +
      COLUMNS.msgs +
      COLUMNS.preview +
      15;
    expect(separatorWidth()).toBe(expected);
  });
});
