import { z } from "zod";
import { ARTIFACT_TYPES, CONTRACT_STATUSES } from "../enums";
import { auditFieldsSchema, durationMinutesSchema, metadataSchema, scoreValueSchema, timeRangeSchema } from "./common";
import { contractIdSchema, userIdSchema } from "./ids";

export const contractTermsSchema = z.object({
  minValidMinutes: durationMinutesSchema,
  maxMissedCheckpoints: z.number().int().nonnegative(),
  mandatoryArtifactTypes: z.array(z.enum(ARTIFACT_TYPES)),
  vivaPassingScore: scoreValueSchema,
  checkpointIntervalMinutes: durationMinutesSchema.optional(),
  maxPauseMinutes: durationMinutesSchema.optional()
});

export const contractSchema = auditFieldsSchema.extend({
  id: contractIdSchema,
  userId: userIdSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  status: z.enum(CONTRACT_STATUSES),
  terms: contractTermsSchema,
  activeRange: timeRangeSchema,
  signedAt: auditFieldsSchema.shape.createdAt.optional(),
  activatedAt: auditFieldsSchema.shape.createdAt.optional(),
  endedAt: auditFieldsSchema.shape.createdAt.optional(),
  tags: z.array(z.string().trim().min(1)),
  metadata: metadataSchema.optional()
});

export type ContractTerms = z.infer<typeof contractTermsSchema>;
export type Contract = z.infer<typeof contractSchema>;
