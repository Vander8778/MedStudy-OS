import type { ArtifactType } from "./enums";
import type { DurationMinutes, ScoreValue } from "./time";

export type ContractTerms = {
  minValidMinutes: DurationMinutes;
  maxMissedCheckpoints: number;
  mandatoryArtifactTypes: readonly ArtifactType[];
  vivaPassingScore: ScoreValue;
  checkpointIntervalMinutes?: DurationMinutes;
  maxPauseMinutes?: DurationMinutes;
};
