import {
  vivaEvaluationInputSchema,
  vivaEvaluationOutputSchema,
  type VivaEvaluationInput,
  type VivaEvaluationOutput
} from "@medstudy/ai-schemas";
import { Injectable } from "@nestjs/common";
import { RetryPipeline } from "../validation/retry-pipeline";
import type { AiCapability } from "./capability.interface";

@Injectable()
export class VivaEvaluationCapability
  implements AiCapability<VivaEvaluationInput, VivaEvaluationOutput>
{
  readonly key = "evaluation.viva" as const;
  readonly promptKey = "evaluation.viva" as const;
  readonly inputSchema = vivaEvaluationInputSchema;
  readonly outputSchema = vivaEvaluationOutputSchema;
  readonly retryOptions = {
    maxAttempts: 3,
    correctionHint: true
  };
  readonly providerConfig = {
    maxTokens: 1800,
    temperature: 0.1
  };

  constructor(private readonly retryPipeline: RetryPipeline) {}

  execute(input: VivaEvaluationInput) {
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
