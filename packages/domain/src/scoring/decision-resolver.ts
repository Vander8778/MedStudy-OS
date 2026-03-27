import { COMPLETED_THRESHOLD, PARTIAL_THRESHOLD } from "./constants";
import type {
  DecisionResolution,
  HardFailEvaluation,
  SessionOutcome
} from "./types";

function buildThresholdTrace(outcome: SessionOutcome) {
  switch (outcome) {
    case "completed":
      return {
        min: COMPLETED_THRESHOLD,
        max: 100,
        outcome
      };
    case "partial":
      return {
        min: PARTIAL_THRESHOLD,
        max: COMPLETED_THRESHOLD,
        outcome
      };
    case "failed":
      return {
        min: 0,
        max: PARTIAL_THRESHOLD,
        outcome
      };
  }
}

export function resolveScoringDecision(
  weightedScore: number,
  hardFail: HardFailEvaluation
): DecisionResolution {
  if (hardFail.triggered) {
    return {
      outcome: "failed",
      decisionTrace: {
        decidedByHardFail: true
      }
    };
  }

  let outcome: SessionOutcome;

  if (weightedScore >= COMPLETED_THRESHOLD) {
    outcome = "completed";
  } else if (weightedScore >= PARTIAL_THRESHOLD) {
    outcome = "partial";
  } else {
    outcome = "failed";
  }

  return {
    outcome,
    decisionTrace: {
      decidedByHardFail: false,
      scoreThresholdApplied: buildThresholdTrace(outcome)
    }
  };
}
