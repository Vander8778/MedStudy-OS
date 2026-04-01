import type {
  MasteryCalculationResult,
  MasteryTrackProgress,
  MasteryTrackUpdate,
  SessionGamificationOutcome
} from "./types";

type MasteryCalculationInput = {
  sessionOutcome: SessionGamificationOutcome;
  finalScore: number;
  hasCriticalViolation: boolean;
  currentMasteryTracks: readonly MasteryTrackProgress[];
};

function getIncrementPercent(
  sessionOutcome: SessionGamificationOutcome,
  finalScore: number
) {
  if (sessionOutcome === "completed") {
    return Math.floor(finalScore * 0.5);
  }

  if (sessionOutcome === "partial") {
    return Math.floor(finalScore * 0.2);
  }

  return 0;
}

function updateTrack(
  track: MasteryTrackProgress,
  incrementPercent: number
): MasteryTrackUpdate {
  const previousLevel = track.currentLevel;
  const previousProgressPercent = track.progressPercent;

  if (incrementPercent <= 0) {
    return {
      trackId: track.id,
      trackKey: track.key,
      previousLevel,
      newLevel: previousLevel,
      previousProgressPercent,
      newProgressPercent: previousProgressPercent,
      levelsGained: 0,
      leveledUp: false
    };
  }

  let nextLevel = previousLevel;
  let nextProgress = previousProgressPercent + incrementPercent;
  let levelsGained = 0;

  while (nextLevel < track.maxLevel && nextProgress >= 100) {
    nextProgress -= 100;
    nextLevel += 1;
    levelsGained += 1;
  }

  if (nextLevel >= track.maxLevel) {
    nextLevel = track.maxLevel;
    nextProgress = Math.min(100, nextProgress);
  }

  return {
    trackId: track.id,
    trackKey: track.key,
    previousLevel,
    newLevel: nextLevel,
    previousProgressPercent,
    newProgressPercent: Math.min(100, nextProgress),
    levelsGained,
    leveledUp: levelsGained > 0
  };
}

export function calculateMasteryProgress(
  input: MasteryCalculationInput
): MasteryCalculationResult {
  if (input.hasCriticalViolation) {
    return {
      incrementPercent: 0,
      updates: input.currentMasteryTracks.map((track) => ({
        trackId: track.id,
        trackKey: track.key,
        previousLevel: track.currentLevel,
        newLevel: track.currentLevel,
        previousProgressPercent: track.progressPercent,
        newProgressPercent: track.progressPercent,
        levelsGained: 0,
        leveledUp: false
      })),
      totalLevelsGained: 0
    };
  }

  const incrementPercent = getIncrementPercent(
    input.sessionOutcome,
    input.finalScore
  );
  const updates = input.currentMasteryTracks.map((track) =>
    updateTrack(track, incrementPercent)
  );

  return {
    incrementPercent,
    updates,
    totalLevelsGained: updates.reduce(
      (total, update) => total + update.levelsGained,
      0
    )
  };
}
