import { z } from "zod";
import { PROFILE_STUDY_STAGES, USER_ROLES, USER_STATUSES } from "../enums";
import { auditFieldsSchema, emailAddressSchema, localeCodeSchema, timezoneNameSchema } from "./common";
import { avatarIdSchema, profileIdSchema, userIdSchema } from "./ids";

export const userSchema = auditFieldsSchema.extend({
  id: userIdSchema,
  email: emailAddressSchema,
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES)
});

export const profileSchema = auditFieldsSchema.extend({
  id: profileIdSchema,
  userId: userIdSchema,
  displayName: z.string().trim().min(1),
  timezone: timezoneNameSchema,
  locale: localeCodeSchema,
  studyStage: z.enum(PROFILE_STUDY_STAGES),
  institutionName: z.string().trim().min(1).optional(),
  graduationYear: z.number().int().min(1900).max(3000).optional(),
  avatarId: avatarIdSchema.optional(),
  biography: z.string().trim().min(1).optional()
});

export type User = z.infer<typeof userSchema>;
export type Profile = z.infer<typeof profileSchema>;
