import { Injectable } from "@nestjs/common";
import type { AiCapability } from "./capability.interface";
import type { AiCapabilityKey } from "../types";
import { ArtifactEvaluationCapability } from "./artifact-eval.capability";
import { CheckpointGenerationCapability } from "./checkpoint-gen.capability";
import { PlanningCapability } from "./planning.capability";
import { SessionSummaryCapability } from "./summary.capability";
import { VivaEvaluationCapability } from "./viva-eval.capability";

@Injectable()
export class CapabilityRegistry {
  private readonly capabilities = new Map<AiCapabilityKey, AiCapability>();

  constructor(
    planningCapability: PlanningCapability,
    checkpointGenerationCapability: CheckpointGenerationCapability,
    artifactEvaluationCapability: ArtifactEvaluationCapability,
    vivaEvaluationCapability: VivaEvaluationCapability,
    sessionSummaryCapability: SessionSummaryCapability
  ) {
    [
      planningCapability,
      checkpointGenerationCapability,
      artifactEvaluationCapability,
      vivaEvaluationCapability,
      sessionSummaryCapability
    ].forEach((capability) => {
      this.capabilities.set(capability.key, capability);
    });
  }

  getCapability(key: AiCapabilityKey): AiCapability {
    const capability = this.capabilities.get(key);

    if (!capability) {
      throw new Error(`Unknown AI capability: ${key}`);
    }

    return capability;
  }
}
