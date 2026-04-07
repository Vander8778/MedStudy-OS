import type { GamificationInput, ScoringInput } from "@medstudy/domain";

export function buildScoringInputs(
  overrides: Partial<ScoringInput> = {}
): ScoringInput {
  const contract = {
    minValidMinutes: 45,
    maxMissedCheckpoints: 1,
    mandatoryArtifactTypes: ["final_submission"],
    vivaPassingScore: 70,
    ...(overrides.contract ?? {})
  };

  const session = {
    validMinutes: 50,
    invalidMinutes: 0,
    plannedDurationMinutes: 60,
    warningCount: 0,
    missedCheckpointCount: 0,
    totalCheckpointCount: 2,
    finalArtifactRequired: true,
    ...(overrides.session ?? {})
  };

  const components = {
    validTimeScore: 100,
    processScore: 90,
    artifactScore: 100,
    knowledgeScore: 85,
    ...(overrides.components ?? {})
  };

  const hardFailSignals = {
    mandatoryFinalArtifactMissing: false,
    criticalContractViolation: false,
    vivaScore: 85,
    ...(overrides.hardFailSignals ?? {})
  };

  return {
    contract,
    session,
    components,
    hardFailSignals
  };
}

export function buildGamificationInput(
  overrides: Partial<GamificationInput> = {}
): GamificationInput {
  return {
    userId: "user_fixture" as GamificationInput["userId"],
    sessionId: "session_fixture" as GamificationInput["sessionId"],
    sessionOutcome: "completed",
    finalScore: 92 as GamificationInput["finalScore"],
    scoringBreakdown: {
      validTimeScore: 100 as GamificationInput["scoringBreakdown"]["validTimeScore"],
      processScore: 90 as GamificationInput["scoringBreakdown"]["processScore"],
      artifactScore: 100 as GamificationInput["scoringBreakdown"]["artifactScore"],
      knowledgeScore: 88 as GamificationInput["scoringBreakdown"]["knowledgeScore"]
    },
    hardFailApplied: false,
    checkpointsCompleted: 2,
    checkpointsMissed: 0,
    artifactsAccepted: 1,
    vivaAttempts: 1,
    contractViolationCount: 0,
    hasCriticalViolation: false,
    avoidanceDetected: false,
    avoidanceRecovered: false,
    sessionDurationMinutes: 60,
    validMinutes: 55,
    sessionEndedAt: "2026-04-07T10:00:00.000Z" as GamificationInput["sessionEndedAt"],
    qualifyingDate: "2026-04-07" as GamificationInput["qualifyingDate"],
    currentStreak: {
      currentLength: 2 as GamificationInput["currentStreak"]["currentLength"],
      longestLength: 2 as GamificationInput["currentStreak"]["longestLength"],
      lastQualifyingDate: "2026-04-06" as GamificationInput["currentStreak"]["lastQualifyingDate"]
    },
    currentAvatarStats: {
      discipline: 10 as GamificationInput["currentAvatarStats"]["discipline"],
      consistency: 10 as GamificationInput["currentAvatarStats"]["consistency"],
      clinicalThinking: 10 as GamificationInput["currentAvatarStats"]["clinicalThinking"],
      knowledgeDepth: 10 as GamificationInput["currentAvatarStats"]["knowledgeDepth"],
      recovery: 10 as GamificationInput["currentAvatarStats"]["recovery"]
    },
    currentUserLevel: {
      level: 2 as GamificationInput["currentUserLevel"]["level"],
      totalXP: 180 as GamificationInput["currentUserLevel"]["totalXP"]
    },
    currentMasteryTracks: [],
    xpEarnedToday: 0 as GamificationInput["xpEarnedToday"],
    sessionOutcomeCounts: {
      completed: 2,
      partial: 0,
      failed: 0,
      penalized: 0
    },
    contractCompletionCount: 1,
    unlockConditions: [],
    alreadyUnlockedAvatarIds: [],
    ...overrides
  };
}
