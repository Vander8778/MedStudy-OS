import { z } from "zod";
import { PENALTY_REASONS, PENALTY_STATUSES, PENALTY_TYPES } from "../enums";
import { auditFieldsSchema, isoDateTimeStringSchema, metadataSchema } from "./common";
import { contractIdSchema, penaltyIdSchema, sessionIdSchema, userIdSchema } from "./ids";

export const penaltySchema = auditFieldsSchema.extend({
  id: penaltyIdSchema,
  userId: userIdSchema,
  contractId: contractIdSchema.optional(),
  sessionId: sessionIdSchema.optional(),
  type: z.enum(PENALTY_TYPES),
  reason: z.enum(PENALTY_REASONS),
  status: z.enum(PENALTY_STATUSES),
  issuedAt: isoDateTimeStringSchema,
  expiresAt: isoDateTimeStringSchema.optional(),
  resolvedAt: isoDateTimeStringSchema.optional(),
  notes: z.string().trim().min(1).optional(),
  metadata: metadataSchema.optional()
});

export type Penalty = z.infer<typeof penaltySchema>;
