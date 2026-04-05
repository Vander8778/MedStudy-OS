import { describe, expect, it, vi } from "vitest";
import {
  formatDateTime,
  formatMinutes,
  formatPercent,
  formatRelativeAge,
  formatScore,
  formatTimeRange
} from "./formatters";

describe("mobile formatters", () => {
  it("formats minutes and percentages safely", () => {
    expect(formatMinutes(125)).toBe("2h 5m");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatPercent(74.3)).toBe("74%");
  });

  it("formats scores and ranges with fallbacks", () => {
    expect(formatScore(88.25)).toBe("88.3%");
    expect(formatScore(null)).toBe("Not scored");
    expect(
      formatTimeRange("2026-04-05T10:00:00.000Z", "2026-04-05T11:00:00.000Z")
    ).toContain("2026");
  });

  it("reports relative cache age", () => {
    vi.setSystemTime(new Date("2026-04-05T12:00:00.000Z"));
    expect(formatRelativeAge("2026-04-05T11:30:00.000Z")).toBe("30m ago");
    expect(formatRelativeAge("2026-04-05T10:00:00.000Z")).toBe("2h ago");
    expect(formatDateTime(undefined)).toBe("Not available");
    vi.useRealTimers();
  });
});
