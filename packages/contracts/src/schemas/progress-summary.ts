import { z } from "zod";
import { AVATAR_STAT_KEYS } from "../enums";
import {
  durationMinutesSchema,
  isoDateStringSchema,
  percentageSchema
} from "./common";
import { avatarIdSchema, userIdSchema } from "./ids";
import { masteryTrackSchema } from "./mastery-track";

export const avatarStatsSummarySchema = z.object({
  discipline: percentageSchema,
  consistency: percentageSchema,
  clinicalThinking: percentageSchema,
  knowledgeDepth: percentageSchema,
  recovery: percentageSchema
}).strict() satisfies z.ZodType<Record<(typeof AVATAR_STAT_KEYS)[number], number>>;

export const userLevelProgressSchema = z.object({
  level: z.number().int().positive(),
  totalXP: z.number().int().nonnegative(),
  xpToNextLevel: z.number().int().nonnegative()
}).strict();

export const streakProgressSummarySchema = z.object({
  currentLength: z.number().int().nonnegative(),
  longestLength: z.number().int().nonnegative(),
  lastQualifyingDate: isoDateStringSchema.optional()
}).strict();

export const progressSummarySchema = z.object({
  userId: userIdSchema,
  totalXP: z.number().int().nonnegative(),
  level: userLevelProgressSchema,
  streak: streakProgressSummarySchema,
  avatarStats: avatarStatsSummarySchema,
  masteryTracks: z.array(masteryTrackSchema).readonly(),
  unlockedAvatarIds: z.array(avatarIdSchema).readonly(),
  totalValidMinutes: durationMinutesSchema.optional()
}).strict();

export type AvatarStatsSummary = z.infer<typeof avatarStatsSummarySchema>;
export type UserLevelProgress = z.infer<typeof userLevelProgressSchema>;
export type StreakProgressSummary = z.infer<typeof streakProgressSummarySchema>;
export type ProgressSummary = z.infer<typeof progressSummarySchema>;
