import { AVATAR_STAT_CAP, AVATAR_STAT_MULTIPLIERS } from "./constants";
import type {
  AvatarStatDelta,
  AvatarStatValue,
  AvatarStats,
  SessionGamificationOutcome
} from "./types";

type AvatarStatCalculationInput = {
  sessionOutcome: SessionGamificationOutcome;
  hasCriticalViolation: boolean;
  validTimeScore: number;
  artifactScore: number;
  knowledgeScore: number;
  currentStreakLength: number;
  avoidanceRecovered: boolean;
  currentAvatarStats: AvatarStats;
};

function toAvatarStatValue(value: number): AvatarStatValue {
  return Math.max(0, Math.min(AVATAR_STAT_CAP, Math.floor(value))) as AvatarStatValue;
}

function calculateDelta(rawGain: number, multiplier: number) {
  return Math.max(0, Math.floor(rawGain * multiplier));
}

export function calculateAvatarStatProgress(
  input: AvatarStatCalculationInput
): {
  newStats: AvatarStats;
  deltas: readonly AvatarStatDelta[];
} {
  if (
    input.hasCriticalViolation ||
    input.sessionOutcome === "failed" ||
    input.sessionOutcome === "penalized"
  ) {
    return {
      newStats: input.currentAvatarStats,
      deltas: []
    };
  }

  const multiplier = AVATAR_STAT_MULTIPLIERS[input.sessionOutcome];
  const requestedDeltas = {
    discipline: calculateDelta(Math.floor(input.validTimeScore / 20), multiplier),
    consistency: calculateDelta(
      Math.min(Math.floor(input.currentStreakLength / 3), 3),
      multiplier
    ),
    clinicalThinking: calculateDelta(
      Math.floor(input.knowledgeScore / 25),
      multiplier
    ),
    knowledgeDepth: calculateDelta(
      Math.floor(input.artifactScore / 25),
      multiplier
    ),
    recovery: calculateDelta(input.avoidanceRecovered ? 3 : 0, multiplier)
  } as const;

  const newStats: AvatarStats = {
    discipline: toAvatarStatValue(
      input.currentAvatarStats.discipline + requestedDeltas.discipline
    ),
    consistency: toAvatarStatValue(
      input.currentAvatarStats.consistency + requestedDeltas.consistency
    ),
    clinicalThinking: toAvatarStatValue(
      input.currentAvatarStats.clinicalThinking + requestedDeltas.clinicalThinking
    ),
    knowledgeDepth: toAvatarStatValue(
      input.currentAvatarStats.knowledgeDepth + requestedDeltas.knowledgeDepth
    ),
    recovery: toAvatarStatValue(
      input.currentAvatarStats.recovery + requestedDeltas.recovery
    )
  };

  const deltas: AvatarStatDelta[] = [
    {
      key: "discipline",
      previousValue: input.currentAvatarStats.discipline,
      delta: toAvatarStatValue(newStats.discipline - input.currentAvatarStats.discipline),
      newValue: newStats.discipline
    },
    {
      key: "consistency",
      previousValue: input.currentAvatarStats.consistency,
      delta: toAvatarStatValue(newStats.consistency - input.currentAvatarStats.consistency),
      newValue: newStats.consistency
    },
    {
      key: "clinicalThinking",
      previousValue: input.currentAvatarStats.clinicalThinking,
      delta: toAvatarStatValue(
        newStats.clinicalThinking - input.currentAvatarStats.clinicalThinking
      ),
      newValue: newStats.clinicalThinking
    },
    {
      key: "knowledgeDepth",
      previousValue: input.currentAvatarStats.knowledgeDepth,
      delta: toAvatarStatValue(
        newStats.knowledgeDepth - input.currentAvatarStats.knowledgeDepth
      ),
      newValue: newStats.knowledgeDepth
    },
    {
      key: "recovery",
      previousValue: input.currentAvatarStats.recovery,
      delta: toAvatarStatValue(newStats.recovery - input.currentAvatarStats.recovery),
      newValue: newStats.recovery
    }
  ].filter((delta) => delta.delta > 0);

  return {
    newStats,
    deltas
  };
}
