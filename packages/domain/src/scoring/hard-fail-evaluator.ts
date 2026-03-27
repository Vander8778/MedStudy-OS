import type { HardFailEvaluation, HardFailReason, ScoringInput } from "./types";

export function evaluateHardFailConditions(input: ScoringInput): HardFailEvaluation {
  const reasons: HardFailReason[] = [];

  if (input.session.validMinutes < input.contract.minValidMinutes) {
    reasons.push("insufficient_valid_time");
  }

  if (
    input.session.finalArtifactRequired &&
    input.hardFailSignals.mandatoryFinalArtifactMissing
  ) {
    reasons.push("mandatory_artifact_missing");
  }

  if (input.session.missedCheckpointCount > input.contract.maxMissedCheckpoints) {
    reasons.push("exceeded_missed_checkpoints");
  }

  if (
    input.hardFailSignals.vivaScore !== undefined &&
    input.hardFailSignals.vivaScore < input.contract.vivaPassingScore
  ) {
    reasons.push("viva_below_threshold");
  }

  if (input.hardFailSignals.criticalContractViolation === true) {
    reasons.push("critical_contract_violation");
  }

  return {
    triggered: reasons.length > 0,
    reasons
  };
}
