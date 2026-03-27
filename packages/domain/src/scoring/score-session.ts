import { evaluateHardFailConditions } from "./hard-fail-evaluator";
import { resolveScoringDecision } from "./decision-resolver";
import { calculateWeightedSessionScore } from "./weighted-scorer";
import type {
  ScoreSessionResult,
  ScoringComponentInputKey,
  ScoringInput
} from "./types";

const COMPONENT_SCORE_KEYS: readonly ScoringComponentInputKey[] = [
  "validTimeScore",
  "processScore",
  "artifactScore",
  "knowledgeScore"
] as const;

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isValidPercentage(value: number): boolean {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function validateNonNegativeNumber(value: number, fieldName: string): string | null {
  if (!isFiniteNumber(value)) {
    return `${fieldName} must be a finite number.`;
  }

  if (value < 0) {
    return `${fieldName} must be non-negative.`;
  }

  return null;
}

function validateNonNegativeInteger(value: number, fieldName: string): string | null {
  if (!Number.isInteger(value)) {
    return `${fieldName} must be an integer.`;
  }

  return validateNonNegativeNumber(value, fieldName);
}

function validateScoringInput(input: ScoringInput): string | null {
  const nonNegativeNumberFields: Array<[number, string]> = [
    [input.contract.minValidMinutes, "contract.minValidMinutes"],
    [input.session.validMinutes, "session.validMinutes"],
    [input.session.invalidMinutes, "session.invalidMinutes"],
    [input.session.plannedDurationMinutes, "session.plannedDurationMinutes"]
  ];

  for (const [value, fieldName] of nonNegativeNumberFields) {
    const error = validateNonNegativeNumber(value, fieldName);
    if (error) {
      return error;
    }
  }

  const integerFields: Array<[number, string]> = [
    [input.contract.maxMissedCheckpoints, "contract.maxMissedCheckpoints"],
    [input.session.warningCount, "session.warningCount"],
    [input.session.missedCheckpointCount, "session.missedCheckpointCount"],
    [input.session.totalCheckpointCount, "session.totalCheckpointCount"]
  ];

  for (const [value, fieldName] of integerFields) {
    const error = validateNonNegativeInteger(value, fieldName);
    if (error) {
      return error;
    }
  }

  if (input.session.missedCheckpointCount > input.session.totalCheckpointCount) {
    return "session.missedCheckpointCount cannot exceed session.totalCheckpointCount.";
  }

  if (!isValidPercentage(input.contract.vivaPassingScore)) {
    return "contract.vivaPassingScore must be within 0..100.";
  }

  if (
    input.hardFailSignals.vivaScore !== undefined &&
    !isValidPercentage(input.hardFailSignals.vivaScore)
  ) {
    return "hardFailSignals.vivaScore must be within 0..100 when provided.";
  }

  for (const key of COMPONENT_SCORE_KEYS) {
    const value = input.components[key];
    if (value !== undefined && !isValidPercentage(value)) {
      return `components.${key} must be within 0..100 when provided.`;
    }
  }

  return null;
}

export function scoreSession(input: ScoringInput): ScoreSessionResult {
  const validationError = validateScoringInput(input);

  if (validationError) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      reason: validationError
    };
  }

  const hardFail = evaluateHardFailConditions(input);
  const weightedScore = calculateWeightedSessionScore(input.components);
  const decision = resolveScoringDecision(weightedScore.sessionScore, hardFail);

  return {
    ok: true,
    result: {
      outcome: decision.outcome,
      sessionScore: weightedScore.sessionScore,
      components: weightedScore.components,
      hardFail,
      decisionTrace: decision.decisionTrace
    }
  };
}
