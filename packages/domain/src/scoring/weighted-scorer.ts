import {
  SCORING_COMPONENT_INPUT_KEYS,
  SCORING_COMPONENT_ORDER,
  SCORING_COMPONENT_WEIGHTS
} from "./constants";
import type { ScoringComponentName, ScoringInput, WeightedScoringResult } from "./types";

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateWeightedSessionScore(
  componentsInput: ScoringInput["components"]
): WeightedScoringResult {
  const presentWeightTotal = SCORING_COMPONENT_ORDER.reduce((total, componentName) => {
    const inputKey = SCORING_COMPONENT_INPUT_KEYS[componentName];
    return componentsInput[inputKey] === undefined
      ? total
      : total + SCORING_COMPONENT_WEIGHTS[componentName];
  }, 0);

  const components = {
    validTime: { raw: null, weight: 0, weighted: 0 },
    process: { raw: null, weight: 0, weighted: 0 },
    artifact: { raw: null, weight: 0, weighted: 0 },
    knowledge: { raw: null, weight: 0, weighted: 0 }
  } satisfies WeightedScoringResult["components"];

  if (presentWeightTotal === 0) {
    return {
      sessionScore: 0,
      components
    };
  }

  let totalScore = 0;

  for (const componentName of SCORING_COMPONENT_ORDER) {
    const inputKey = SCORING_COMPONENT_INPUT_KEYS[componentName];
    const raw = componentsInput[inputKey];

    if (raw === undefined) {
      components[componentName] = {
        raw: null,
        weight: 0,
        weighted: 0
      };
      continue;
    }

    const effectiveWeight = SCORING_COMPONENT_WEIGHTS[componentName] / presentWeightTotal;
    const weightedContribution = raw * effectiveWeight;

    components[componentName] = {
      raw,
      weight: effectiveWeight,
      weighted: weightedContribution
    };

    totalScore += weightedContribution;
  }

  return {
    sessionScore: roundToTwoDecimals(totalScore),
    components
  };
}

export function getComponentScore(
  componentsInput: ScoringInput["components"],
  componentName: ScoringComponentName
): number | undefined {
  return componentsInput[SCORING_COMPONENT_INPUT_KEYS[componentName]];
}
