import {
  sessionSummaryInputSchema,
  sessionSummaryOutputSchema,
  type SessionSummaryInput,
  type SessionSummaryOutput
} from "@medstudy/ai-schemas";
import { Injectable } from "@nestjs/common";
import { RetryPipeline } from "../validation/retry-pipeline";
import type { AiCapability } from "./capability.interface";

@Injectable()
export class SessionSummaryCapability
  implements AiCapability<SessionSummaryInput, SessionSummaryOutput>
{
  readonly key = "summary.session" as const;
  readonly promptKey = "summary.session" as const;
  readonly inputSchema = sessionSummaryInputSchema;
  readonly outputSchema = sessionSummaryOutputSchema;
  readonly retryOptions = {
    maxAttempts: 3,
    correctionHint: true
  };
  readonly providerConfig = {
    maxTokens: 1400,
    temperature: 0.2
  };

  constructor(private readonly retryPipeline: RetryPipeline) {}

  execute(input: SessionSummaryInput) {
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
