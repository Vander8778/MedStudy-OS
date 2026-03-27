import type { ScoringComponentInputKey, ScoringComponentName } from "./types";

export const VALID_TIME_WEIGHT = 0.35;
export const PROCESS_WEIGHT = 0.2;
export const ARTIFACT_WEIGHT = 0.25;
export const KNOWLEDGE_WEIGHT = 0.2;

const WEIGHT_SUM =
  VALID_TIME_WEIGHT + PROCESS_WEIGHT + ARTIFACT_WEIGHT + KNOWLEDGE_WEIGHT;

if (Math.abs(WEIGHT_SUM - 1.0) > 1e-10) {
  throw new Error(`Scoring weights must sum to 1.0, got ${WEIGHT_SUM}`);
}

export const COMPLETED_THRESHOLD = 85;
export const PARTIAL_THRESHOLD = 65;

export const SCORING_COMPONENT_ORDER: readonly ScoringComponentName[] = [
  "validTime",
  "process",
  "artifact",
  "knowledge"
] as const;

export const SCORING_COMPONENT_INPUT_KEYS: Readonly<
  Record<ScoringComponentName, ScoringComponentInputKey>
> = {
  validTime: "validTimeScore",
  process: "processScore",
  artifact: "artifactScore",
  knowledge: "knowledgeScore"
} as const;

export const SCORING_COMPONENT_WEIGHTS: Readonly<Record<ScoringComponentName, number>> = {
  validTime: VALID_TIME_WEIGHT,
  process: PROCESS_WEIGHT,
  artifact: ARTIFACT_WEIGHT,
  knowledge: KNOWLEDGE_WEIGHT
} as const;
