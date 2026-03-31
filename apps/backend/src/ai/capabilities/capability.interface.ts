import type { ZodType } from "zod";
import type {
  AiCapabilityFailure,
  AiCapabilityKey,
  AiCapabilityResult,
  AiProviderConfig,
  AiProviderKey,
  CapabilityRetryOptions
} from "../types";

export interface AiCapability<TInput = unknown, TOutput = unknown> {
  readonly key: AiCapabilityKey;
  readonly promptKey: AiCapabilityKey;
  readonly inputSchema: ZodType<TInput>;
  readonly outputSchema: ZodType<TOutput>;
  readonly retryOptions?: CapabilityRetryOptions;
  readonly providerKey?: AiProviderKey;
  readonly providerConfig?: Partial<AiProviderConfig>;
  execute(input: TInput): Promise<AiCapabilityResult<TOutput> | AiCapabilityFailure>;
}
