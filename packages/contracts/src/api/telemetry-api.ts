import { z } from "zod";
import { TELEMETRY_EVENT_TYPES, TELEMETRY_SOURCES } from "../enums";
import { isoDateTimeStringSchema, metadataSchema, nonEmptyStringSchema } from "../schemas/common";
import {
  AVOIDANCE_RECOMMENDED_RESPONSES,
  AVOIDANCE_SEVERITIES
} from "./session-api";

export const antiAvoidancePatternViewSchema = z.object({
  pattern: nonEmptyStringSchema,
  detected: z.boolean(),
  severity: z.enum(AVOIDANCE_SEVERITIES),
  message: nonEmptyStringSchema,
  details: metadataSchema.optional()
});

export const antiAvoidanceSummaryViewSchema = z.object({
  patterns: z.array(antiAvoidancePatternViewSchema).readonly(),
  overallSeverity: z.enum(AVOIDANCE_SEVERITIES),
  hasEscalationSignal: z.boolean(),
  recommendedResponses: z.array(
    z.enum(AVOIDANCE_RECOMMENDED_RESPONSES)
  ).readonly()
});

export const ingestTelemetryRequestSchema = z.object({
  userId: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema.optional(),
  source: z.enum(TELEMETRY_SOURCES),
  type: z.enum(TELEMETRY_EVENT_TYPES),
  occurredAt: isoDateTimeStringSchema,
  receivedAt: isoDateTimeStringSchema,
  payload: metadataSchema
}).refine(
  (input) => Date.parse(input.receivedAt) >= Date.parse(input.occurredAt),
  {
    path: ["receivedAt"],
    message: "receivedAt must be on or after occurredAt"
  }
);

export const ingestTelemetryResponseSchema = z.object({
  telemetryEventId: nonEmptyStringSchema,
  antiAvoidance: antiAvoidanceSummaryViewSchema.nullable()
});

export type IngestTelemetryRequest = z.infer<typeof ingestTelemetryRequestSchema>;
export type IngestTelemetryResponse = z.infer<typeof ingestTelemetryResponseSchema>;
