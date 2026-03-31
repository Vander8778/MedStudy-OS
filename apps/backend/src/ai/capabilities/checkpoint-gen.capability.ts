import {
  checkpointGenerationInputSchema,
  checkpointGenerationOutputSchema,
  type CheckpointGenerationInput,
  type CheckpointGenerationOutput
} from "@medstudy/ai-schemas";
import { Injectable } from "@nestjs/common";
import { RetryPipeline } from "../validation/retry-pipeline";
import type { AiCapability } from "./capability.interface";

@Injectable()
export class CheckpointGenerationCapability
  implements AiCapability<CheckpointGenerationInput, CheckpointGenerationOutput>
{
  readonly key = "generation.checkpoint" as const;
  readonly promptKey = "generation.checkpoint" as const;
  readonly inputSchema = checkpointGenerationInputSchema;
  readonly outputSchema = checkpointGenerationOutputSchema;
  readonly retryOptions = {
    maxAttempts: 3,
    correctionHint: true
  };
  readonly providerConfig = {
    maxTokens: 1400,
    temperature: 0.2
  };

  constructor(private readonly retryPipeline: RetryPipeline) {}

  execute(input: CheckpointGenerationInput) {
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
