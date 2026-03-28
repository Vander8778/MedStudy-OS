CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "displayName" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "studyStage" TEXT NOT NULL,
  "timezone" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL,
  "minValidMinutes" REAL NOT NULL,
  "maxMissedCheckpoints" INTEGER NOT NULL,
  "mandatoryArtifactTypesJson" TEXT NOT NULL,
  "vivaPassingScore" REAL NOT NULL,
  "checkpointIntervalMinutes" REAL,
  "maxPauseMinutes" REAL,
  "activeRangeStartsAt" DATETIME NOT NULL,
  "activeRangeEndsAt" DATETIME NOT NULL,
  "signedAt" DATETIME,
  "activatedAt" DATETIME,
  "endedAt" DATETIME,
  "tagsJson" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "plannedRangeStartsAt" DATETIME NOT NULL,
  "plannedRangeEndsAt" DATETIME NOT NULL,
  "startedAt" DATETIME,
  "endedAt" DATETIME,
  "reviewRequestedAt" DATETIME,
  "validMinutes" REAL NOT NULL,
  "invalidMinutes" REAL NOT NULL,
  "warningCount" INTEGER NOT NULL,
  "missedCheckpointCount" INTEGER NOT NULL,
  "finalArtifactRequired" BOOLEAN NOT NULL,
  "notes" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Session_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SessionBlock" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "rangeStartsAt" DATETIME NOT NULL,
  "rangeEndsAt" DATETIME NOT NULL,
  "sourceEventId" TEXT,
  "creditedMinutes" REAL NOT NULL,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SessionBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SessionEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorLabel" TEXT,
  "state" TEXT,
  "occurredAt" DATETIME NOT NULL,
  "detailsJson" TEXT,
  CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Checkpoint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "dueAt" DATETIME NOT NULL,
  "completedAt" DATETIME,
  "artifactId" TEXT,
  "evaluationId" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Checkpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Artifact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isMandatory" BOOLEAN NOT NULL,
  "createdByUserId" TEXT,
  "submittedAt" DATETIME,
  "mediaType" TEXT,
  "uri" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Artifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Evaluation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evaluator" TEXT NOT NULL,
  "artifactId" TEXT,
  "checkpointId" TEXT,
  "vivaAttemptId" TEXT,
  "evaluatedAt" DATETIME,
  "score" REAL,
  "notes" TEXT,
  "evidenceArtifactIdsJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Evaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VivaAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "promptTemplateId" TEXT,
  "status" TEXT NOT NULL,
  "scheduledAt" DATETIME,
  "startedAt" DATETIME,
  "completedAt" DATETIME,
  "transcriptArtifactId" TEXT,
  "evaluationId" TEXT,
  "score" REAL,
  "passingScore" REAL,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "VivaAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Penalty" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "contractId" TEXT,
  "sessionId" TEXT,
  "type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "issuedAt" DATETIME NOT NULL,
  "expiresAt" DATETIME,
  "resolvedAt" DATETIME,
  "notes" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Penalty_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "TelemetryEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT,
  "source" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "receivedAt" DATETIME NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  CONSTRAINT "TelemetryEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DomainEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT,
  "type" TEXT NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  CONSTRAINT "DomainEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ScoringResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "sessionScore" REAL NOT NULL,
  "componentsJson" TEXT NOT NULL,
  "hardFailJson" TEXT NOT NULL,
  "decisionTraceJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  CONSTRAINT "ScoringResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ContractEvaluationResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "allRulesPassed" BOOLEAN NOT NULL,
  "hasCriticalViolation" BOOLEAN NOT NULL,
  "rulesJson" TEXT NOT NULL,
  "criticalViolationsJson" TEXT NOT NULL,
  "warningsJson" TEXT NOT NULL,
  "informationalJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  CONSTRAINT "ContractEvaluationResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AntiAvoidanceResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "overallSeverity" TEXT NOT NULL,
  "hasEscalationSignal" BOOLEAN NOT NULL,
  "patternsJson" TEXT NOT NULL,
  "recommendedResponsesJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  CONSTRAINT "AntiAvoidanceResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");
CREATE INDEX "Contract_userId_idx" ON "Contract"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_profileId_idx" ON "Session"("profileId");
CREATE INDEX "Session_contractId_idx" ON "Session"("contractId");
CREATE INDEX "SessionEvent_sessionId_idx" ON "SessionEvent"("sessionId");
CREATE INDEX "Checkpoint_sessionId_idx" ON "Checkpoint"("sessionId");
CREATE INDEX "Artifact_sessionId_idx" ON "Artifact"("sessionId");
CREATE INDEX "Evaluation_sessionId_idx" ON "Evaluation"("sessionId");
CREATE INDEX "VivaAttempt_sessionId_idx" ON "VivaAttempt"("sessionId");
CREATE INDEX "Penalty_sessionId_idx" ON "Penalty"("sessionId");
CREATE INDEX "TelemetryEvent_sessionId_idx" ON "TelemetryEvent"("sessionId");
CREATE INDEX "DomainEvent_sessionId_idx" ON "DomainEvent"("sessionId");
CREATE INDEX "ScoringResult_sessionId_idx" ON "ScoringResult"("sessionId");
CREATE INDEX "ContractEvaluationResult_sessionId_idx" ON "ContractEvaluationResult"("sessionId");
CREATE INDEX "AntiAvoidanceResult_sessionId_idx" ON "AntiAvoidanceResult"("sessionId");
