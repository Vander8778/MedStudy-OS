import { QUALIFYING_STREAK_OUTCOMES } from "./constants";
import type {
  SessionGamificationOutcome,
  StreakCalculationResult,
  StreakLength,
  StreakRecord
} from "./types";

type StreakCalculationInput = {
  sessionOutcome: SessionGamificationOutcome;
  currentStreak: StreakRecord;
  qualifyingDate: string;
};

function toStreakLength(value: number): StreakLength {
  return Math.max(0, Math.floor(value)) as StreakLength;
}

function toUtcDay(dateString: string) {
  return Date.parse(`${dateString}T00:00:00.000Z`);
}

function differenceInDays(left: string, right: string) {
  return Math.round((toUtcDay(left) - toUtcDay(right)) / 86_400_000);
}

export function calculateStreak(
  input: StreakCalculationInput
): StreakCalculationResult {
  if (!QUALIFYING_STREAK_OUTCOMES.includes(input.sessionOutcome)) {
    return {
      streak: input.currentStreak,
      incremented: false,
      broken: false,
      unchanged: true
    };
  }

  if (!input.currentStreak.lastQualifyingDate) {
    const currentLength = toStreakLength(1);
    return {
      streak: {
        currentLength,
        longestLength: toStreakLength(
          Math.max(input.currentStreak.longestLength, currentLength)
        ),
        lastQualifyingDate: input.qualifyingDate as StreakRecord["lastQualifyingDate"]
      },
      incremented: true,
      broken: false,
      unchanged: false
    };
  }

  const dayGap = differenceInDays(
    input.qualifyingDate,
    input.currentStreak.lastQualifyingDate
  );

  if (dayGap <= 0) {
    return {
      streak: {
        ...input.currentStreak,
        lastQualifyingDate: input.currentStreak.lastQualifyingDate
      },
      incremented: false,
      broken: false,
      unchanged: true
    };
  }

  if (dayGap === 1) {
    const nextLength = toStreakLength(input.currentStreak.currentLength + 1);
    return {
      streak: {
        currentLength: nextLength,
        longestLength: toStreakLength(
          Math.max(input.currentStreak.longestLength, nextLength)
        ),
        lastQualifyingDate: input.qualifyingDate as StreakRecord["lastQualifyingDate"]
      },
      incremented: true,
      broken: false,
      unchanged: false
    };
  }

  return {
    streak: {
      currentLength: toStreakLength(1),
      longestLength: toStreakLength(
        Math.max(input.currentStreak.longestLength, 1)
      ),
      lastQualifyingDate: input.qualifyingDate as StreakRecord["lastQualifyingDate"]
    },
    incremented: true,
    broken: true,
    unchanged: false
  };
}
