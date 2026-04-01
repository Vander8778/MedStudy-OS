import type { LevelNumber, LevelUpdate, XPAmount, UserLevel } from "./types";

function toXPAmount(value: number): XPAmount {
  return Math.max(0, Math.floor(value)) as XPAmount;
}

function toLevelNumber(value: number): LevelNumber {
  return Math.max(1, Math.floor(value)) as LevelNumber;
}

export function xpForLevel(level: number) {
  if (level <= 1) {
    return 0;
  }

  const n = level - 1;
  return Math.floor((100 * n * (n + 1)) / 2);
}

export function calculateLevelFromTotalXP(totalXP: number): LevelNumber {
  let level = 1;

  while (xpForLevel(level + 1) <= totalXP) {
    level += 1;
  }

  return toLevelNumber(level);
}

export function calculateLevelUpdate(
  currentUserLevel: UserLevel,
  awardedXP: XPAmount
): LevelUpdate {
  const totalXP = toXPAmount(currentUserLevel.totalXP + awardedXP);
  const newLevel = calculateLevelFromTotalXP(totalXP);
  const xpToNextLevel = toXPAmount(xpForLevel(newLevel + 1) - totalXP);

  return {
    previousLevel: currentUserLevel.level,
    newLevel,
    totalXP,
    xpToNextLevel,
    leveledUp: newLevel > currentUserLevel.level
  };
}
