import { z } from "zod";
import { metadataSchema, nonEmptyStringSchema } from "../schemas/common";
import { promptTemplateIdSchema } from "../schemas/ids";

export const aiPromptReferenceSchema = z.object({
  promptTemplateId: promptTemplateIdSchema.optional(),
  promptTemplateKey: nonEmptyStringSchema,
  promptTemplateVersion: nonEmptyStringSchema
});

export const aiStructuredOutputEnvelopeSchema = z.object({
  schemaKey: nonEmptyStringSchema,
  schemaVersion: nonEmptyStringSchema,
  payload: metadataSchema
});

export type AiPromptReference = z.infer<typeof aiPromptReferenceSchema>;
export type AiStructuredOutputEnvelope = z.infer<typeof aiStructuredOutputEnvelopeSchema>;
