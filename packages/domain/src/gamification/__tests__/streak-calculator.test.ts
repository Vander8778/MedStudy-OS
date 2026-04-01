import { describe, expect, it } from "vitest";
import { calculateStreak } from "../streak-calculator";

function createCurrentStreak() {
  return {
    currentLength: 3,
    longestLength: 4,
    lastQualifyingDate: "2026-03-31"
  } as never;
}

describe("calculateStreak", () => {
  it("does not increment on the same qualifying day", () => {
    const result = calculateStreak({
      sessionOutcome: "completed",
      currentStreak: createCurrentStreak(),
      qualifyingDate: "2026-03-31"
    });

    expect(result.incremented).toBe(false);
    expect(result.streak.currentLength).toBe(3);
  });

  it("increments on the next qualifying day", () => {
    const result = calculateStreak({
      sessionOutcome: "partial",
      currentStreak: createCurrentStreak(),
      qualifyingDate: "2026-04-01"
    });

    expect(result.incremented).toBe(true);
    expect(result.broken).toBe(false);
    expect(result.streak.currentLength).toBe(4);
  });

  it("resets when there is a qualifying-day gap", () => {
    const result = calculateStreak({
      sessionOutcome: "completed",
      currentStreak: createCurrentStreak(),
      qualifyingDate: "2026-04-03"
    });

    expect(result.incremented).toBe(true);
    expect(result.broken).toBe(true);
    expect(result.streak.currentLength).toBe(1);
    expect(result.streak.longestLength).toBe(4);
  });

  it("does not extend the streak for failed sessions", () => {
    const result = calculateStreak({
      sessionOutcome: "failed",
      currentStreak: createCurrentStreak(),
      qualifyingDate: "2026-04-01"
    });

    expect(result.incremented).toBe(false);
    expect(result.broken).toBe(false);
    expect(result.streak.currentLength).toBe(3);
  });

  it("updates the longest streak when the current streak exceeds it", () => {
    const result = calculateStreak({
      sessionOutcome: "completed",
      currentStreak: {
        currentLength: 4,
        longestLength: 4,
        lastQualifyingDate: "2026-03-31"
      } as never,
      qualifyingDate: "2026-04-01"
    });

    expect(result.streak.currentLength).toBe(5);
    expect(result.streak.longestLength).toBe(5);
  });

  it("treats same-day re-qualification after a reset as a no-op", () => {
    const firstResult = calculateStreak({
      sessionOutcome: "completed",
      currentStreak: createCurrentStreak(),
      qualifyingDate: "2026-04-03"
    });
    const secondResult = calculateStreak({
      sessionOutcome: "completed",
      currentStreak: firstResult.streak,
      qualifyingDate: "2026-04-03"
    });

    expect(firstResult.streak.currentLength).toBe(1);
    expect(secondResult.incremented).toBe(false);
    expect(secondResult.streak.currentLength).toBe(1);
  });
});
