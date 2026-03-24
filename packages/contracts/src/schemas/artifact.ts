import { z } from "zod";
import { ARTIFACT_SOURCES, ARTIFACT_STATUSES, ARTIFACT_TYPES } from "../enums";
import { auditFieldsSchema, isoDateTimeStringSchema, metadataSchema, urlStringSchema } from "./common";
import { artifactIdSchema, sessionIdSchema, userIdSchema } from "./ids";

export const artifactSchema = auditFieldsSchema.extend({
  id: artifactIdSchema,
  sessionId: sessionIdSchema,
  type: z.enum(ARTIFACT_TYPES),
  source: z.enum(ARTIFACT_SOURCES),
  status: z.enum(ARTIFACT_STATUSES),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  isMandatory: z.boolean(),
  createdByUserId: userIdSchema.optional(),
  submittedAt: isoDateTimeStringSchema.optional(),
  mediaType: z.string().trim().min(1).optional(),
  uri: urlStringSchema.optional(),
  metadata: metadataSchema.optional()
});

export type Artifact = z.infer<typeof artifactSchema>;
