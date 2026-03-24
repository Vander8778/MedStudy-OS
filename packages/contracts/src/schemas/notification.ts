import { z } from "zod";
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from "../enums";
import { auditFieldsSchema, isoDateTimeStringSchema, metadataSchema } from "./common";
import { notificationIdSchema, userIdSchema } from "./ids";

export const notificationSchema = auditFieldsSchema.extend({
  id: notificationIdSchema,
  userId: userIdSchema,
  type: z.enum(NOTIFICATION_TYPES),
  channel: z.enum(NOTIFICATION_CHANNELS),
  status: z.enum(NOTIFICATION_STATUSES),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  scheduledAt: isoDateTimeStringSchema.optional(),
  sentAt: isoDateTimeStringSchema.optional(),
  readAt: isoDateTimeStringSchema.optional(),
  data: metadataSchema.optional()
});

export type Notification = z.infer<typeof notificationSchema>;
