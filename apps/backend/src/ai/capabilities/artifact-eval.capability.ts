import {
  artifactEvaluationInputSchema,
  artifactEvaluationOutputSchema,
  type ArtifactEvaluationInput,
  type ArtifactEvaluationOutput
} from "@medstudy/ai-schemas";
import { Injectable } from "@nestjs/common";
import { RetryPipeline } from "../validation/retry-pipeline";
import type { AiCapability } from "./capability.interface";

@Injectable()
export class ArtifactEvaluationCapability
  implements AiCapability<ArtifactEvaluationInput, ArtifactEvaluationOutput>
{
  readonly key = "evaluation.artifact" as const;
  readonly promptKey = "evaluation.artifact" as const;
  readonly inputSchema = artifactEvaluationInputSchema;
  readonly outputSchema = artifactEvaluationOutputSchema;
  readonly retryOptions = {
    maxAttempts: 3,
    correctionHint: true
  };
  readonly providerConfig = {
    maxTokens: 1600,
    temperature: 0.1
  };

  constructor(private readonly retryPipeline: RetryPipeline) {}

  execute(input: ArtifactEvaluationInput) {
    return this.retryPipeline.execute({
      capabilityKey: this.key,
      promptKey: this.promptKey,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      input,
      retryOptions: this.retryOptions,
      providerConfig: this.providerConfig
    });
  }
}
