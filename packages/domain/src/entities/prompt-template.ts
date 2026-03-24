import type { AuditFields, MetadataMap } from "../value-objects/common";
import type { PromptTemplateId } from "../value-objects/ids";
import type { EntityCode } from "../value-objects/primitives";
import type { PromptTemplateCategory, PromptTemplateStatus } from "@medstudy/contracts";

export type PromptTemplate = AuditFields & {
  id: PromptTemplateId;
  key: EntityCode;
  version: string;
  name: string;
  description?: string;
  category: PromptTemplateCategory;
  status: PromptTemplateStatus;
  inputSchemaKey?: string;
  outputSchemaKey?: string;
  systemPrompt: string;
  developerPrompt?: string;
  userPromptTemplate?: string;
  metadata?: MetadataMap;
};
