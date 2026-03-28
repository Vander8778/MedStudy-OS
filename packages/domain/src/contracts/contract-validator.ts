import type {
  ContractValidationInput,
  ContractValidationIssue,
  ContractValidationResult
} from "./types";

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function getActiveRangeDurationMinutes(
  input: ContractValidationInput["activeRange"]
): number | null {
  const startsAt = Date.parse(input.startsAt);
  const endsAt = Date.parse(input.endsAt);

  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
    return null;
  }

  return (endsAt - startsAt) / 60000;
}

export function validateContractTerms(
  input: ContractValidationInput
): ContractValidationResult {
  const issues: ContractValidationIssue[] = [];
  const activeRangeDurationMinutes = getActiveRangeDurationMinutes(input.activeRange);

  if (!isFiniteNumber(input.terms.minValidMinutes) || input.terms.minValidMinutes <= 0) {
    issues.push({
      field: "terms.minValidMinutes",
      code: "min_valid_minutes_not_positive",
      message: "minValidMinutes must be greater than 0."
    });
  }

  if (
    activeRangeDurationMinutes !== null &&
    isFiniteNumber(input.terms.minValidMinutes) &&
    input.terms.minValidMinutes > activeRangeDurationMinutes
  ) {
    issues.push({
      field: "terms.minValidMinutes",
      code: "min_valid_minutes_exceeds_duration",
      message: "minValidMinutes must not exceed the activeRange duration."
    });
  }

  if (
    !isFiniteNumber(input.terms.maxMissedCheckpoints) ||
    input.terms.maxMissedCheckpoints < 0
  ) {
    issues.push({
      field: "terms.maxMissedCheckpoints",
      code: "max_missed_checkpoints_negative",
      message: "maxMissedCheckpoints must be greater than or equal to 0."
    });
  }

  if (
    !isFiniteNumber(input.terms.vivaPassingScore) ||
    input.terms.vivaPassingScore < 0 ||
    input.terms.vivaPassingScore > 100
  ) {
    issues.push({
      field: "terms.vivaPassingScore",
      code: "viva_passing_score_out_of_range",
      message: "vivaPassingScore must be within 0..100."
    });
  }

  if (activeRangeDurationMinutes === null) {
    issues.push({
      field: "activeRange",
      code: "active_range_invalid",
      message: "activeRange must have a positive duration."
    });
  }

  input.terms.mandatoryArtifactTypes.forEach((artifactType, index) => {
    if (artifactType.trim().length === 0) {
      issues.push({
        field: `terms.mandatoryArtifactTypes[${index}]`,
        code: "empty_artifact_type",
        message: "mandatoryArtifactTypes must not contain empty strings."
      });
    }
  });

  if (input.terms.maxPauseMinutes !== undefined) {
    if (!isFiniteNumber(input.terms.maxPauseMinutes) || input.terms.maxPauseMinutes <= 0) {
      issues.push({
        field: "terms.maxPauseMinutes",
        code: "max_pause_minutes_not_positive",
        message: "maxPauseMinutes must be greater than 0 when provided."
      });
    }

    if (
      activeRangeDurationMinutes !== null &&
      isFiniteNumber(input.terms.maxPauseMinutes) &&
      input.terms.maxPauseMinutes > activeRangeDurationMinutes
    ) {
      issues.push({
        field: "terms.maxPauseMinutes",
        code: "max_pause_minutes_exceeds_duration",
        message: "maxPauseMinutes must not exceed the activeRange duration."
      });
    }
  }

  if (input.terms.checkpointIntervalMinutes !== undefined) {
    if (
      !isFiniteNumber(input.terms.checkpointIntervalMinutes) ||
      input.terms.checkpointIntervalMinutes <= 0
    ) {
      issues.push({
        field: "terms.checkpointIntervalMinutes",
        code: "checkpoint_interval_not_positive",
        message: "checkpointIntervalMinutes must be greater than 0 when provided."
      });
    }
  }

  if (issues.length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    issues
  };
}
