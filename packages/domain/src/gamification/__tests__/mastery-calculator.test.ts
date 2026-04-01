import { describe, expect, it } from "vitest";
import { calculateMasteryProgress } from "../mastery-calculator";

function createTracks() {
  return [
    {
      id: "track_1",
      key: "cardiology",
      currentLevel: 1,
      maxLevel: 3,
      progressPercent: 20
    }
  ] as never;
}

describe("calculateMasteryProgress", () => {
  it("applies the completed-session increment", () => {
    const result = calculateMasteryProgress({
      sessionOutcome: "completed",
      finalScore: 80,
      currentMasteryTracks: createTracks()
    });

    expect(result.incrementPercent).toBe(40);
    expect(result.updates[0]).toMatchObject({
      previousLevel: 1,
      newLevel: 1,
      newProgressPercent: 60
    });
  });

  it("applies the partial-session increment", () => {
    const result = calculateMasteryProgress({
      sessionOutcome: "partial",
      finalScore: 80,
      currentMasteryTracks: createTracks()
    });

    expect(result.incrementPercent).toBe(16);
    expect(result.updates[0].newProgressPercent).toBe(36);
  });

  it("does not increment mastery on failed sessions", () => {
    const result = calculateMasteryProgress({
      sessionOutcome: "failed",
      finalScore: 90,
      currentMasteryTracks: createTracks()
    });

    expect(result.incrementPercent).toBe(0);
    expect(result.updates[0].levelsGained).toBe(0);
    expect(result.updates[0].newProgressPercent).toBe(20);
  });

  it("levels up with carry remainder when progress crosses 100", () => {
    const result = calculateMasteryProgress({
      sessionOutcome: "completed",
      finalScore: 100,
      currentMasteryTracks: [
        {
          id: "track_1",
          key: "cardiology",
          currentLevel: 1,
          maxLevel: 3,
          progressPercent: 80
        }
      ] as never
    });

    expect(result.updates[0]).toMatchObject({
      previousLevel: 1,
      newLevel: 2,
      levelsGained: 1,
      newProgressPercent: 30
    });
  });

  it("respects the max-level cap", () => {
    const result = calculateMasteryProgress({
      sessionOutcome: "completed",
      finalScore: 100,
      currentMasteryTracks: [
        {
          id: "track_1",
          key: "cardiology",
          currentLevel: 3,
          maxLevel: 3,
          progressPercent: 90
        }
      ] as never
    });

    expect(result.updates[0]).toMatchObject({
      previousLevel: 3,
      newLevel: 3,
      newProgressPercent: 100
    });
  });
});
