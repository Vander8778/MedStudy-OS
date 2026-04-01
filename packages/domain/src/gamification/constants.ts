import type { AvatarStatKey, XPSource } from "@medstudy/contracts";
import type { SessionGamificationOutcome } from "./types";

export const ZERO_XP_OUTCOMES: readonly SessionGamificationOutcome[] = [
  "failed",
  "penalized"
] as const;

export const SESSION_XP_VALUES = {
  completed: 100,
  partial: 40
} as const satisfies Record<Exclude<SessionGamificationOutcome, "failed" | "penalized">, number>;

export const CHECKPOINT_XP_PER_ITEM = 10;
export const CHECKPOINT_XP_CAP = 5;
export const ARTIFACT_XP_PER_ITEM = 15;
export const ARTIFACT_XP_CAP = 3;
export const VIVA_XP_PER_ITEM = 25;
export const VIVA_XP_CAP = 2;
export const STREAK_BONUS_PER_DAY = 5;
export const STREAK_BONUS_MAX = 50;
export const STREAK_BONUS_MIN_STREAK = 3;
export const MASTERY_LEVEL_UP_XP = 30;
export const RECOVERY_BONUS_XP = 20;
export const PER_SESSION_XP_CAP = 275;
export const DAILY_XP_CAP = 500;

export const XP_LEDGER_ORDER: readonly XPSource[] = [
  "session_completed",
  "session_partial",
  "checkpoint_completed",
  "artifact_accepted",
  "viva_passed",
  "streak_bonus",
  "mastery_level_up",
  "recovery_bonus"
] as const;

export const QUALIFYING_STREAK_OUTCOMES: readonly SessionGamificationOutcome[] = [
  "completed",
  "partial"
] as const;

export const AVATAR_STAT_CAP = 100;
export const AVATAR_STAT_MULTIPLIERS = {
  completed: 1,
  partial: 0.5
} as const;

export const AVATAR_STAT_KEYS_IN_ORDER: readonly AvatarStatKey[] = [
  "discipline",
  "consistency",
  "clinicalThinking",
  "knowledgeDepth",
  "recovery"
] as const;
