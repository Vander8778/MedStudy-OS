import { z } from "zod";
export * from "../schemas/api-shared";
import { metadataSchema, nonEmptyStringSchema } from "../schemas/common";

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: nonEmptyStringSchema,
    message: nonEmptyStringSchema,
    details: metadataSchema.optional()
  })
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
