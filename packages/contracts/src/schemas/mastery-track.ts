import { z } from "zod";
import { MASTERY_TRACK_STATUSES } from "../enums";
import { auditFieldsSchema, entityCodeSchema, isoDateTimeStringSchema, percentageSchema } from "./common";
import { masteryTrackIdSchema, userIdSchema } from "./ids";

export const masteryTrackSchema = auditFieldsSchema.extend({
  id: masteryTrackIdSchema,
  userId: userIdSchema,
  key: entityCodeSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  status: z.enum(MASTERY_TRACK_STATUSES),
  currentLevel: z.number().int().nonnegative(),
  maxLevel: z.number().int().positive(),
  progressPercent: percentageSchema,
  lastEvaluatedAt: isoDateTimeStringSchema.optional()
});

export type MasteryTrack = z.infer<typeof masteryTrackSchema>;
