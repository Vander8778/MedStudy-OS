import type {
  AiCapabilityKey as SchemaCapabilityKey,
  ArtifactEvaluationInput,
  ArtifactEvaluationOutput,
  CheckpointGenerationInput,
  CheckpointGenerationOutput,
  PlanningSessionInput,
  PlanningSessionOutput,
  SessionSummaryInput,
  SessionSummaryOutput,
  VivaEvaluationInput,
  VivaEvaluationOutput
} from "@medstudy/ai-schemas";
import type { ZodType } from "zod";

export type AiCapabilityKey = SchemaCapabilityKey;
export type AiProviderKey = "anthropic";
export type AiAuditLevel = "minimal" | "validated_output" | "full";

export type AiCapabilityInputMap = {
  "planning.session": PlanningSessionInput;
  "generation.checkpoint": CheckpointGenerationInput;
  "evaluation.artifact": ArtifactEvaluationInput;
  "evaluation.viva": VivaEvaluationInput;
  "summary.session": SessionSummaryInput;
};

export type AiCapabilityOutputMap = {
  "planning.session": PlanningSessionOutput;
  "generation.checkpoint": CheckpointGenerationOutput;
  "evaluation.artifact": ArtifactEvaluationOutput;
  "evaluation.viva": VivaEvaluationOutput;
  "summary.session": SessionSummaryOutput;
};

export interface AiProviderConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AiCompletionRequest {
  systemPrompt: string;
  developerPrompt?: string;
  userPrompt: string;
  config: AiProviderConfig;
  requestId: string;
}

export interface AiCompletionResponse {
  rawText: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  requestId: string;
}

export type AiProviderErrorKind =
  | "auth"
  | "config"
  | "rate_limit"
  | "timeout"
  | "server"
  | "network"
  | "unknown";

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiProviderErrorKind,
    message: string,
    readonly retryable: boolean,
    readonly statusCode?: number
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export type PromptRenderSuccess<TInput> = {
  ok: true;
  systemPrompt: string;
  developerPrompt?: string;
  userPrompt: string;
  validatedInput: TInput;
};

export type PromptRenderFailure = {
  ok: false;
  error: string;
  issues?: unknown;
};

export type OutputValidationSuccess<TOutput> = {
  ok: true;
  data: TOutput;
  parsedJson: unknown;
};

export type OutputValidationFailure = {
  ok: false;
  error: string;
  validationErrors?: unknown;
};

export type AiCapabilityResult<T> = {
  capabilityKey: string;
  promptKey: string;
  promptVersion: string;
  model: string;
  requestId: string;
  attemptCount: number;
  data: T;
  inputTokens: number;
  outputTokens: number;
  totalLatencyMs: number;
};

export type AiCapabilityFailure = {
  capabilityKey: string;
  promptKey: string;
  requestId: string;
  attemptCount: number;
  lastError: string;
  lastValidationErrors?: unknown;
};

export type CapabilityRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  backoffMultiplier?: number;
  correctionHint?: boolean;
};

export type ExecuteCapabilityRequest<
  TInput,
  TOutput,
  TCapabilityKey extends AiCapabilityKey = AiCapabilityKey
> = {
  capabilityKey: TCapabilityKey;
  promptKey: TCapabilityKey;
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  input: TInput;
  retryOptions?: CapabilityRetryOptions;
  providerKey?: AiProviderKey;
  providerConfig?: Partial<AiProviderConfig>;
};

export type AiAuditLogEntry = {
  requestId: string;
  capabilityKey: string;
  promptKey: string;
  promptVersion: string;
  model: string;
  inputSummary: Record<string, unknown>;
  validatedOutput?: unknown;
  rawOutput?: string;
  status: "succeeded" | "failed";
  attemptCount: number;
  inputTokens: number;
  outputTokens: number;
  totalLatencyMs: number;
  sessionId?: string;
  userId?: string;
};
