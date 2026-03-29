import { z } from "zod";
import { metadataSchema, nonEmptyStringSchema, timeRangeSchema } from "../schemas/common";
import { contractTermsSchema } from "../schemas/contract";
import { contractSummaryViewSchema } from "./session-api";

export const createContractRequestSchema = z.object({
  userId: nonEmptyStringSchema,
  name: nonEmptyStringSchema.max(200),
  description: nonEmptyStringSchema.max(1000).optional(),
  activeRange: timeRangeSchema,
  terms: contractTermsSchema,
  tags: z.array(nonEmptyStringSchema).readonly().optional(),
  metadata: metadataSchema.optional()
});

export const contractResponseSchema = z.object({
  contract: contractSummaryViewSchema
});

export const getContractResponseSchema = contractResponseSchema;

export type CreateContractRequest = z.infer<typeof createContractRequestSchema>;
export type ContractResponse = z.infer<typeof contractResponseSchema>;
export type GetContractResponse = z.infer<typeof getContractResponseSchema>;
