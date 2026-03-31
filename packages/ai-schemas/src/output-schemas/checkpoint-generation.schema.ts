import { z } from "zod";
import { ARTIFACT_TYPES, durationMinutesSchema, nonEmptyStringSchema } from "@medstudy/contracts";

export const checkpointGenerationOutputSchema = z.object({
  checkpoints: z.array(z.object({
    title: nonEmptyStringSchema,
    rationale: nonEmptyStringSchema,
    suggestedOffsetMinutes: durationMinutesSchema,
    verificationPrompt: nonEmptyStringSchema,
    mandatoryArtifactTypes: z.array(z.enum(ARTIFACT_TYPES)).readonly()
  }).strict()).min(1).readonly()
}).strict();

export type CheckpointGenerationOutput = z.infer<typeof checkpointGenerationOutputSchema>;
