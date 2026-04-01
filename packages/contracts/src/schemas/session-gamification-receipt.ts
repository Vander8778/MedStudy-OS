import { z } from "zod";
import {
  AVATAR_STAT_KEYS,
  GAMIFICATION_TRIGGER_TYPES,
  UNLOCK_CONDITION_TYPES,
  XP_SOURCES
} from "../enums";
import {
  isoDateStringSchema,
  metadataSchema,
  nonEmptyStringSchema,
  percentageSchema
} from "./common";
import {
  avatarIdSchema,
  masteryTrackIdSchema,
  sessionIdSchema,
  userIdSchema
} from "./ids";
import { avatarStatsSummarySchema, streakProgressSummarySchema, userLevelProgressSchema } from "./progress-summary";

export const xpLedgerEntrySchema = z.object({
  source: z.enum(XP_SOURCES),
  requestedAmount: z.number().int().nonnegative(),
  awardedAmount: z.number().int().nonnegative(),
  reason: nonEmptyStringSchema.optional(),
  metadata: metadataSchema.optional()
}).strict();

export const avatarStatDeltaSchema = z.object({
  key: z.enum(AVATAR_STAT_KEYS),
  previousValue: percentageSchema,
  delta: z.number().int().nonnegative(),
  newValue: percentageSchema
}).strict();

export const levelUpdateReceiptSchema = userLevelProgressSchema.extend({
  previousLevel: z.number().int().positive(),
  newLevel: z.number().int().positive(),
  leveledUp: z.boolean()
}).strict();

export const masteryTrackUpdateReceiptSchema = z.object({
  trackId: masteryTrackIdSchema,
  trackKey: nonEmptyStringSchema,
  previousLevel: z.number().int().positive(),
  newLevel: z.number().int().positive(),
  previousProgressPercent: percentageSchema,
  newProgressPercent: percentageSchema,
  levelsGained: z.number().int().nonnegative(),
  leveledUp: z.boolean()
}).strict();

export const unlockAwardReceiptSchema = z.object({
  avatarId: avatarIdSchema,
  conditionId: nonEmptyStringSchema,
  conditionType: z.enum(UNLOCK_CONDITION_TYPES)
}).strict();

export const gamificationTriggerSchema = z.object({
  type: z.enum(GAMIFICATION_TRIGGER_TYPES),
  metadata: metadataSchema.optional()
}).strict();

export const sessionGamificationReceiptSchema = z.object({
  userId: userIdSchema,
  sessionId: sessionIdSchema,
  qualifyingDate: isoDateStringSchema,
  totalXPAwarded: z.number().int().nonnegative(),
  totalXPRequested: z.number().int().nonnegative(),
  sessionCapApplied: z.boolean(),
  dailyCapApplied: z.boolean(),
  zeroRewardReason: nonEmptyStringSchema.optional(),
  xpLedger: z.array(xpLedgerEntrySchema).readonly(),
  streak: streakProgressSummarySchema,
  avatarStats: avatarStatsSummarySchema,
  avatarStatDeltas: z.array(avatarStatDeltaSchema).readonly(),
  level: levelUpdateReceiptSchema,
  masteryUpdates: z.array(masteryTrackUpdateReceiptSchema).readonly(),
  unlocks: z.array(unlockAwardReceiptSchema).readonly(),
  triggers: z.array(gamificationTriggerSchema).readonly()
}).strict();

export type XPLedgerEntryReceipt = z.infer<typeof xpLedgerEntrySchema>;
export type AvatarStatDeltaReceipt = z.infer<typeof avatarStatDeltaSchema>;
export type LevelUpdateReceipt = z.infer<typeof levelUpdateReceiptSchema>;
export type MasteryTrackUpdateReceipt = z.infer<typeof masteryTrackUpdateReceiptSchema>;
export type UnlockAwardReceipt = z.infer<typeof unlockAwardReceiptSchema>;
export type GamificationTriggerReceipt = z.infer<typeof gamificationTriggerSchema>;
export type SessionGamificationReceipt = z.infer<typeof sessionGamificationReceiptSchema>;
