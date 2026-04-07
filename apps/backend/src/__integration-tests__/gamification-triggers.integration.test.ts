import { describe, expect, it } from "vitest";
import { processSessionOutcome } from "@medstudy/domain";
import { buildGamificationInput } from "../__fixtures__/scoring.factory";

describe("gamification triggers integration", () => {
  it("awards downstream rewards for completed and partial outcomes while failed sessions stay zero-reward", () => {
    const completed = processSessionOutcome(buildGamificationInput());
    const partial = processSessionOutcome(
      buildGamificationInput({
        sessionOutcome: "partial",
        finalScore: 71 as ReturnType<typeof buildGamificationInput>["finalScore"]
      })
    );
    const failed = processSessionOutcome(
      buildGamificationInput({
        sessionOutcome: "failed",
        finalScore: 40 as ReturnType<typeof buildGamificationInput>["finalScore"]
      })
    );

    expect(completed.xp.totalXPAwarded).toBeGreaterThan(0);
    expect(partial.xp.totalXPAwarded).toBeGreaterThan(0);
    expect(partial.xp.totalXPAwarded).toBeLessThan(completed.xp.totalXPAwarded);
    expect(failed.xp.totalXPAwarded).toBe(0);
    expect(failed.xp.zeroRewardReason).toBe("failed_session");
  });

  it("stays deterministic when the same terminal outcome is reprocessed", () => {
    const input = buildGamificationInput();
    const first = processSessionOutcome(input);
    const second = processSessionOutcome(input);

    expect(second.xp.totalXPAwarded).toBe(first.xp.totalXPAwarded);
    expect(second.triggers).toEqual(first.triggers);
    expect(second.unlocks).toEqual(first.unlocks);
  });
});
