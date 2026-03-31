import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiRequestLogRepository } from "./audit/ai-request-log.repository";
import { ArtifactEvaluationCapability } from "./capabilities/artifact-eval.capability";
import { CapabilityRegistry } from "./capabilities/capability-registry";
import { CheckpointGenerationCapability } from "./capabilities/checkpoint-gen.capability";
import { PlanningCapability } from "./capabilities/planning.capability";
import { SessionSummaryCapability } from "./capabilities/summary.capability";
import { VivaEvaluationCapability } from "./capabilities/viva-eval.capability";
import { PromptRegistryService } from "./prompts/prompt-registry.service";
import { PromptRenderer } from "./prompts/prompt-renderer";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { ProviderRegistry } from "./providers/provider-registry";
import { OutputValidator } from "./validation/output-validator";
import { RetryPipeline } from "./validation/retry-pipeline";

@Module({
  providers: [
    AnthropicProvider,
    ProviderRegistry,
    PromptRegistryService,
    PromptRenderer,
    OutputValidator,
    AiRequestLogRepository,
    RetryPipeline,
    PlanningCapability,
    CheckpointGenerationCapability,
    ArtifactEvaluationCapability,
    VivaEvaluationCapability,
    SessionSummaryCapability,
    CapabilityRegistry,
    AiService
  ],
  exports: [AiService]
})
export class AiModule {}
