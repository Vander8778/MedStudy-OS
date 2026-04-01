import { describe, expect, it } from "vitest";
import {
  calculateLevelFromTotalXP,
  calculateLevelUpdate,
  xpForLevel
} from "../level-calculator";

describe("level calculator", () => {
  it("resolves boundary levels correctly", () => {
    expect(calculateLevelFromTotalXP(0)).toBe(1);
    expect(calculateLevelFromTotalXP(99)).toBe(1);
    expect(calculateLevelFromTotalXP(100)).toBe(2);
    expect(calculateLevelFromTotalXP(300)).toBe(3);
  });

  it("computes xpToNextLevel correctly", () => {
    const result = calculateLevelUpdate(
      {
        level: 1,
        totalXP: 90
      } as never,
      20 as never
    );

    expect(result.newLevel).toBe(2);
    expect(result.totalXP).toBe(110);
    expect(result.xpToNextLevel).toBe(xpForLevel(3) - 110);
  });

  it("sets leveledUp only when the threshold is crossed", () => {
    expect(
      calculateLevelUpdate(
        {
          level: 1,
          totalXP: 50
        } as never,
        10 as never
      ).leveledUp
    ).toBe(false);
    expect(
      calculateLevelUpdate(
        {
          level: 1,
          totalXP: 90
        } as never,
        20 as never
      ).leveledUp
    ).toBe(true);
  });
});
