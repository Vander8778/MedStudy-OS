import {
  ARTIFACT_XP_CAP,
  ARTIFACT_XP_PER_ITEM,
  CHECKPOINT_XP_CAP,
  CHECKPOINT_XP_PER_ITEM,
  DAILY_XP_CAP,
  MASTERY_LEVEL_UP_XP,
  PER_SESSION_XP_CAP,
  RECOVERY_BONUS_XP,
  SESSION_XP_VALUES,
  STREAK_BONUS_MAX,
  STREAK_BONUS_MIN_STREAK,
  STREAK_BONUS_PER_DAY,
  VIVA_XP_CAP,
  VIVA_XP_PER_ITEM,
  XP_LEDGER_ORDER,
  ZERO_XP_OUTCOMES
} from "./constants";
import type {
  XPAmount,
  XPCalculationResult,
  XPLedgerEntry,
  ZeroRewardReason
} from "./types";

type XPCalculationInput = {
  sessionOutcome: "completed" | "partial" | "failed" | "penalized";
  hasCriticalViolation: boolean;
  checkpointsCompleted: number;
  artifactsAccepted: number;
  vivaAttempts: number;
  streakLength: number;
  avoidanceDetected: boolean;
  avoidanceRecovered: boolean;
  masteryLevelsGained: number;
  xpEarnedToday: number;
};

function toXPAmount(value: number): XPAmount {
  return Math.max(0, Math.floor(value)) as XPAmount;
}

function sumAwarded(entries: readonly XPLedgerEntry[]) {
  return entries.reduce((total, entry) => total + entry.awardedAmount, 0);
}

function sumRequested(entries: readonly XPLedgerEntry[]) {
  return entries.reduce((total, entry) => total + entry.requestedAmount, 0);
}

function buildZeroRewardResult(reason: ZeroRewardReason): XPCalculationResult {
  return {
    ledger: [],
    totalXPRequested: toXPAmount(0),
    totalXPAwarded: toXPAmount(0),
    sessionCapApplied: false,
    dailyCapApplied: false,
    zeroRewardReason: reason
  };
}

function buildRequestedEntries(input: XPCalculationInput): readonly XPLedgerEntry[] {
  const entries: XPLedgerEntry[] = [];

  if (input.sessionOutcome === "completed") {
    entries.push({
      source: "session_completed",
      requestedAmount: toXPAmount(SESSION_XP_VALUES.completed),
      awardedAmount: toXPAmount(0),
      reason: "Completed session base XP."
    });
  } else if (input.sessionOutcome === "partial") {
    entries.push({
      source: "session_partial",
      requestedAmount: toXPAmount(SESSION_XP_VALUES.partial),
      awardedAmount: toXPAmount(0),
      reason: "Partial session base XP."
    });
  }

  const eligibleCheckpoints = Math.min(input.checkpointsCompleted, CHECKPOINT_XP_CAP);
  if (eligibleCheckpoints > 0) {
    entries.push({
      source: "checkpoint_completed",
      requestedAmount: toXPAmount(eligibleCheckpoints * CHECKPOINT_XP_PER_ITEM),
      awardedAmount: toXPAmount(0),
      reason: "Checkpoint completion bonus XP.",
      metadata: {
        checkpointsCompleted: input.checkpointsCompleted,
        eligibleCheckpoints
      }
    });
  }

  const eligibleArtifacts = Math.min(input.artifactsAccepted, ARTIFACT_XP_CAP);
  if (eligibleArtifacts > 0) {
    entries.push({
      source: "artifact_accepted",
      requestedAmount: toXPAmount(eligibleArtifacts * ARTIFACT_XP_PER_ITEM),
      awardedAmount: toXPAmount(0),
      reason: "Accepted artifact bonus XP.",
      metadata: {
        artifactsAccepted: input.artifactsAccepted,
        eligibleArtifacts
      }
    });
  }

  const eligibleVivas = Math.min(input.vivaAttempts, VIVA_XP_CAP);
  if (eligibleVivas > 0) {
    entries.push({
      source: "viva_passed",
      requestedAmount: toXPAmount(eligibleVivas * VIVA_XP_PER_ITEM),
      awardedAmount: toXPAmount(0),
      reason: "Passed viva bonus XP.",
      metadata: {
        vivaAttempts: input.vivaAttempts,
        eligibleVivas
      }
    });
  }

  if (input.streakLength >= STREAK_BONUS_MIN_STREAK) {
    entries.push({
      source: "streak_bonus",
      requestedAmount: toXPAmount(
        Math.min(input.streakLength * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX)
      ),
      awardedAmount: toXPAmount(0),
      reason: "Qualifying streak bonus XP.",
      metadata: {
        streakLength: input.streakLength
      }
    });
  }

  if (input.masteryLevelsGained > 0) {
    entries.push({
      source: "mastery_level_up",
      requestedAmount: toXPAmount(input.masteryLevelsGained * MASTERY_LEVEL_UP_XP),
      awardedAmount: toXPAmount(0),
      reason: "Mastery level-up bonus XP.",
      metadata: {
        masteryLevelsGained: input.masteryLevelsGained
      }
    });
  }

  if (input.avoidanceDetected && input.avoidanceRecovered) {
    entries.push({
      source: "recovery_bonus",
      requestedAmount: toXPAmount(RECOVERY_BONUS_XP),
      awardedAmount: toXPAmount(0),
      reason: "Recovered from detected avoidance pattern.",
      metadata: {
        avoidanceDetected: input.avoidanceDetected,
        avoidanceRecovered: input.avoidanceRecovered
      }
    });
  }

  return XP_LEDGER_ORDER.flatMap((source) =>
    entries.filter((entry) => entry.source === source)
  );
}

export function calculateXP(input: XPCalculationInput): XPCalculationResult {
  if (input.hasCriticalViolation) {
    return buildZeroRewardResult("critical_violation");
  }

  if (ZERO_XP_OUTCOMES.includes(input.sessionOutcome)) {
    return buildZeroRewardResult(
      input.sessionOutcome === "penalized" ? "penalized_session" : "failed_session"
    );
  }

  const requestedEntries = buildRequestedEntries(input);
  const totalXPRequested = toXPAmount(sumRequested(requestedEntries));
  const remainingDailyXP = Math.max(DAILY_XP_CAP - input.xpEarnedToday, 0);
  const totalXPBudget = Math.min(PER_SESSION_XP_CAP, remainingDailyXP);
  const sessionClampedRequested = Math.min(totalXPRequested, PER_SESSION_XP_CAP);
  let remainingBudget = totalXPBudget;

  const awardedEntries = requestedEntries.map((entry) => {
    const awardedAmount = Math.min(entry.requestedAmount, remainingBudget);
    remainingBudget -= awardedAmount;

    return {
      ...entry,
      awardedAmount: toXPAmount(awardedAmount)
    };
  });

  return {
    ledger: awardedEntries,
    totalXPRequested,
    totalXPAwarded: toXPAmount(sumAwarded(awardedEntries)),
    sessionCapApplied: totalXPRequested > PER_SESSION_XP_CAP,
    dailyCapApplied: sessionClampedRequested > remainingDailyXP
  };
}
