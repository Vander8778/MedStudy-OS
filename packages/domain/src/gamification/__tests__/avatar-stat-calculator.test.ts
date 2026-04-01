import { describe, expect, it } from "vitest";
import { calculateAvatarStatProgress } from "../avatar-stat-calculator";

function createStats() {
  return {
    discipline: 10,
    consistency: 10,
    clinicalThinking: 10,
    knowledgeDepth: 10,
    recovery: 10
  } as never;
}

describe("calculateAvatarStatProgress", () => {
  it("applies the completed multiplier across all stat formulas", () => {
    const result = calculateAvatarStatProgress({
      sessionOutcome: "completed",
      hasCriticalViolation: false,
      validTimeScore: 80,
      artifactScore: 50,
      knowledgeScore: 75,
      currentStreakLength: 9,
      avoidanceRecovered: true,
      currentAvatarStats: createStats()
    });

    expect(result.newStats).toMatchObject({
      discipline: 14,
      consistency: 13,
      clinicalThinking: 13,
      knowledgeDepth: 12,
      recovery: 13
    });
  });

  it("applies the partial multiplier and floors the final delta", () => {
    const result = calculateAvatarStatProgress({
      sessionOutcome: "partial",
      hasCriticalViolation: false,
      validTimeScore: 80,
      artifactScore: 50,
      knowledgeScore: 75,
      currentStreakLength: 9,
      avoidanceRecovered: true,
      currentAvatarStats: createStats()
    });

    expect(result.newStats).toMatchObject({
      discipline: 12,
      consistency: 11,
      clinicalThinking: 11,
      knowledgeDepth: 11,
      recovery: 11
    });
  });

  it("never decreases stats and caps them at 100", () => {
    const result = calculateAvatarStatProgress({
      sessionOutcome: "completed",
      hasCriticalViolation: false,
      validTimeScore: 100,
      artifactScore: 100,
      knowledgeScore: 100,
      currentStreakLength: 99,
      avoidanceRecovered: true,
      currentAvatarStats: {
        discipline: 99,
        consistency: 99,
        clinicalThinking: 99,
        knowledgeDepth: 99,
        recovery: 99
      } as never
    });

    expect(result.newStats).toMatchObject({
      discipline: 100,
      consistency: 100,
      clinicalThinking: 100,
      knowledgeDepth: 100,
      recovery: 100
    });
  });

  it("returns no gains for failed or critical-violation sessions", () => {
    const failedResult = calculateAvatarStatProgress({
      sessionOutcome: "failed",
      hasCriticalViolation: false,
      validTimeScore: 100,
      artifactScore: 100,
      knowledgeScore: 100,
      currentStreakLength: 10,
      avoidanceRecovered: true,
      currentAvatarStats: createStats()
    });
    const violationResult = calculateAvatarStatProgress({
      sessionOutcome: "completed",
      hasCriticalViolation: true,
      validTimeScore: 100,
      artifactScore: 100,
      knowledgeScore: 100,
      currentStreakLength: 10,
      avoidanceRecovered: true,
      currentAvatarStats: createStats()
    });

    expect(failedResult.deltas).toEqual([]);
    expect(violationResult.deltas).toEqual([]);
  });
});
