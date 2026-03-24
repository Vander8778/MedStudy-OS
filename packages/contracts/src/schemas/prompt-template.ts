import { z } from "zod";
import { PROMPT_TEMPLATE_CATEGORIES, PROMPT_TEMPLATE_STATUSES } from "../enums";
import { auditFieldsSchema, entityCodeSchema, metadataSchema } from "./common";
import { promptTemplateIdSchema } from "./ids";

export const promptTemplateSchema = auditFieldsSchema.extend({
  id: promptTemplateIdSchema,
  key: entityCodeSchema,
  version: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  category: z.enum(PROMPT_TEMPLATE_CATEGORIES),
  status: z.enum(PROMPT_TEMPLATE_STATUSES),
  inputSchemaKey: z.string().trim().min(1).optional(),
  outputSchemaKey: z.string().trim().min(1).optional(),
  systemPrompt: z.string().trim().min(1),
  developerPrompt: z.string().trim().min(1).optional(),
  userPromptTemplate: z.string().trim().min(1).optional(),
  metadata: metadataSchema.optional()
});

export type PromptTemplate = z.infer<typeof promptTemplateSchema>;
