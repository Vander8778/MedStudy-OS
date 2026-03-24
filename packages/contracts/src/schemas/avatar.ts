import { z } from "zod";
import { AVATAR_RARITIES, AVATAR_UNLOCK_SOURCES } from "../enums";
import { auditFieldsSchema, entityCodeSchema, isoDateTimeStringSchema, urlStringSchema } from "./common";
import { avatarIdSchema, avatarUnlockIdSchema, userIdSchema } from "./ids";

export const avatarSchema = auditFieldsSchema.extend({
  id: avatarIdSchema,
  code: entityCodeSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  rarity: z.enum(AVATAR_RARITIES),
  imageUrl: urlStringSchema.optional(),
  isDefault: z.boolean()
});

export const avatarUnlockSchema = auditFieldsSchema.extend({
  id: avatarUnlockIdSchema,
  userId: userIdSchema,
  avatarId: avatarIdSchema,
  source: z.enum(AVATAR_UNLOCK_SOURCES),
  unlockedAt: isoDateTimeStringSchema
});

export type Avatar = z.infer<typeof avatarSchema>;
export type AvatarUnlock = z.infer<typeof avatarUnlockSchema>;
