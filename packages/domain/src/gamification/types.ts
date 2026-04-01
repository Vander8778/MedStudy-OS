import type {
  AvatarStatKey,
  GamificationTriggerType,
  UnlockConditionType,
  XPSource
} from "@medstudy/contracts";
import type { MasteryTrack } from "../entities/mastery-track";
import type { AvatarId, SessionId, UserId } from "../value-objects/ids";
import type { Brand } from "../value-objects/primitives";
import type { ISODateString, ISODateTimeString, ScoreValue } from "../value-objects/time";

export type XPAmount = Brand<number, "XPAmount">;
export type StreakLength = Brand<number, "StreakLength">;
export type AvatarStatValue = Brand<number, "AvatarStatValue">;
export type LevelNumber = Brand<number, "LevelNumber">;

export type SessionGamificationOutcome =
  | "completed"
  | "partial"
  | "failed"
  | "penalized";

export type ZeroRewardReason =
  | "failed_session"
  | "penalized_session"
  | "critical_violation";

export type ScoringBreakdown = {
  validTimeScore: ScoreValue;
  processScore: ScoreValue;
  artifactScore: ScoreValue;
  knowledgeScore: ScoreValue;
};

export type AvatarStats = {
  discipline: AvatarStatValue;
  consistency: AvatarStatValue;
  clinicalThinking: AvatarStatValue;
  knowledgeDepth: AvatarStatValue;
  recovery: AvatarStatValue;
};

export type AvatarStatDelta = {
  key: AvatarStatKey;
  previousValue: AvatarStatValue;
  delta: AvatarStatValue;
  newValue: AvatarStatValue;
};

export type XPLedgerEntry = {
  source: XPSource;
  requestedAmount: XPAmount;
  awardedAmount: XPAmount;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type XPCalculationResult = {
  ledger: readonly XPLedgerEntry[];
  totalXPRequested: XPAmount;
  totalXPAwarded: XPAmount;
  sessionCapApplied: boolean;
  dailyCapApplied: boolean;
  zeroRewardReason?: ZeroRewardReason;
};

export type StreakRecord = {
  currentLength: StreakLength;
  longestLength: StreakLength;
  lastQualifyingDate?: ISODateString;
};

export type StreakCalculationResult = {
  streak: StreakRecord;
  incremented: boolean;
  broken: boolean;
  unchanged: boolean;
};

export type UserLevel = {
  level: LevelNumber;
  totalXP: XPAmount;
};

export type LevelUpdate = {
  previousLevel: LevelNumber;
  newLevel: LevelNumber;
  totalXP: XPAmount;
  xpToNextLevel: XPAmount;
  leveledUp: boolean;
};

export type MasteryTrackProgress = Pick<
  MasteryTrack,
  "id" | "key" | "currentLevel" | "maxLevel" | "progressPercent"
>;

export type MasteryTrackUpdate = {
  trackId: MasteryTrack["id"];
  trackKey: MasteryTrack["key"];
  previousLevel: number;
  newLevel: number;
  previousProgressPercent: number;
  newProgressPercent: number;
  levelsGained: number;
  leveledUp: boolean;
};

export type MasteryCalculationResult = {
  incrementPercent: number;
  updates: readonly MasteryTrackUpdate[];
  totalLevelsGained: number;
};

type BaseUnlockCondition<TType extends UnlockConditionType> = {
  id: string;
  avatarId: AvatarId;
  type: TType;
};

export type UnlockCondition =
  | (BaseUnlockCondition<"streak_reached"> & {
      type: "streak_reached";
      threshold: number;
    })
  | (BaseUnlockCondition<"mastery_level_reached"> & {
      type: "mastery_level_reached";
      trackKey: string;
      threshold: number;
    })
  | (BaseUnlockCondition<"total_xp_reached"> & {
      type: "total_xp_reached";
      threshold: number;
    })
  | (BaseUnlockCondition<"stat_threshold_reached"> & {
      type: "stat_threshold_reached";
      statKey: AvatarStatKey;
      threshold: number;
    })
  | (BaseUnlockCondition<"session_outcome_count"> & {
      type: "session_outcome_count";
      outcome: SessionGamificationOutcome;
      threshold: number;
    })
  | (BaseUnlockCondition<"contract_completion"> & {
      type: "contract_completion";
      threshold: number;
    });

export type UnlockAward = {
  avatarId: AvatarId;
  conditionId: UnlockCondition["id"];
  conditionType: UnlockConditionType;
};

export type GamificationTrigger = {
  type: GamificationTriggerType;
  metadata?: Record<string, unknown>;
};

export type GamificationInput = {
  userId: UserId;
  sessionId: SessionId;
  sessionOutcome: SessionGamificationOutcome;
  finalScore: ScoreValue;
  scoringBreakdown: ScoringBreakdown;
  hardFailApplied: boolean;
  checkpointsCompleted: number;
  checkpointsMissed: number;
  artifactsAccepted: number;
  // In M10 this is treated as the authoritative count of XP-eligible viva passes.
  vivaAttempts: number;
  contractViolationCount: number;
  hasCriticalViolation: boolean;
  avoidanceDetected: boolean;
  avoidanceRecovered: boolean;
  sessionDurationMinutes: number;
  validMinutes: number;
  sessionEndedAt: ISODateTimeString;
  qualifyingDate: ISODateString;
  currentStreak: StreakRecord;
  currentAvatarStats: AvatarStats;
  currentUserLevel: UserLevel;
  currentMasteryTracks: readonly MasteryTrackProgress[];
  xpEarnedToday: XPAmount;
  sessionOutcomeCounts: Record<SessionGamificationOutcome, number>;
  contractCompletionCount: number;
  unlockConditions: readonly UnlockCondition[];
  alreadyUnlockedAvatarIds: readonly AvatarId[];
};

export type GamificationResult = {
  userId: UserId;
  sessionId: SessionId;
  qualifyingDate: ISODateString;
  xp: XPCalculationResult;
  streak: StreakRecord;
  streakChange: StreakCalculationResult;
  avatarStats: AvatarStats;
  avatarStatDeltas: readonly AvatarStatDelta[];
  level: LevelUpdate;
  mastery: MasteryCalculationResult;
  unlocks: readonly UnlockAward[];
  triggers: readonly GamificationTrigger[];
};
