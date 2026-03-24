import { z } from "zod";
import { TELEMETRY_EVENT_TYPES, TELEMETRY_SOURCES } from "../enums";
import { isoDateTimeStringSchema, metadataSchema } from "./common";
import { sessionIdSchema, telemetryEventIdSchema, userIdSchema } from "./ids";

export const telemetryEventSchema = z.object({
  id: telemetryEventIdSchema,
  userId: userIdSchema,
  sessionId: sessionIdSchema.optional(),
  source: z.enum(TELEMETRY_SOURCES),
  type: z.enum(TELEMETRY_EVENT_TYPES),
  occurredAt: isoDateTimeStringSchema,
  receivedAt: isoDateTimeStringSchema,
  payload: metadataSchema
});

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
