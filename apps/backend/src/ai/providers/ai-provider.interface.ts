import type { AiCompletionRequest, AiCompletionResponse, AiProviderKey } from "../types";

export interface AiProvider {
  readonly key: AiProviderKey;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
