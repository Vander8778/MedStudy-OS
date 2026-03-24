import { z } from "zod";
import { metadataSchema, nonEmptyStringSchema } from "./common";

export const paginationQuerySchema = z.object({
  cursor: nonEmptyStringSchema.optional(),
  limit: z.number().int().positive().max(100).optional()
});

export const apiProblemSchema = z.object({
  code: nonEmptyStringSchema,
  message: nonEmptyStringSchema,
  details: metadataSchema.optional()
});

export const entityEnvelopeSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: itemSchema
  });

export const listEnvelopeSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    nextCursor: nonEmptyStringSchema.nullable().optional()
  });
