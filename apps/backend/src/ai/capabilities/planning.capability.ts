import {
  planningSessionInputSchema,
  planningSessionOutputSchema,
  type PlanningSessionInput,
  type PlanningSessionOutput
} from "@medstudy/ai-schemas";
import { Injectable } from "@nestjs/common";
import { RetryPipeline } from "../validation/retry-pipeline";
import type { AiCapability } from "./capability.interface";

@Injectable()
export class PlanningCapability
  implements AiCapability<PlanningSessionInput, PlanningSessionOutput>
{
  readonly key = "planning.session" as const;
  readonly promptKey = "planning.session" as const;
  readonly inputSchema = planningSessionInputSchema;
  readonly outputSchema = planningSessionOutputSchema;
  readonly retryOptions = {
    maxAttempts: 3,
    correctionHint: true
  };
  readonly providerConfig = {
    maxTokens: 1400,
    temperature: 0.2
  };

  constructor(private readonly retryPipeline: RetryPipeline) {}

  execute(input: PlanningSessionInput) {
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
