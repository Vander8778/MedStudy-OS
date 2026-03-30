ALTER TABLE "TelemetryEvent" ADD COLUMN "clientEventId" TEXT;
ALTER TABLE "TelemetryEvent" ADD COLUMN "serverReceivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "TelemetryEvent_sessionId_serverReceivedAt_idx" ON "TelemetryEvent"("sessionId", "serverReceivedAt");
CREATE UNIQUE INDEX "TelemetryEvent_sessionId_clientEventId_key" ON "TelemetryEvent"("sessionId", "clientEventId");

CREATE TABLE "TelemetrySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "windowStartsAt" DATETIME NOT NULL,
    "windowEndsAt" DATETIME NOT NULL,
    "rawEventCount" INTEGER NOT NULL,
    "lastRawEventId" TEXT NOT NULL,
    "idleMinutes" REAL NOT NULL,
    "longestIdleStretchMinutes" REAL NOT NULL,
    "contextSwitchCount" INTEGER NOT NULL,
    "nonStudyContextMinutes" REAL NOT NULL,
    "nonStudyContextDetected" BOOLEAN NOT NULL,
    "inputActivityLevel" TEXT NOT NULL,
    "sessionElapsedMinutes" REAL NOT NULL,
    "sessionValidMinutes" REAL NOT NULL,
    "sessionInvalidMinutes" REAL NOT NULL,
    "sessionWarningCount" INTEGER NOT NULL,
    "sessionMissedCheckpointCount" INTEGER NOT NULL,
    "currentWarningActive" BOOLEAN NOT NULL,
    "currentWarningDurationMinutes" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "TelemetrySummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TelemetrySummary_sessionId_createdAt_idx" ON "TelemetrySummary"("sessionId", "createdAt");

CREATE TABLE "TelemetryAnalysisCheckpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "lastProcessedRawEventId" TEXT,
    "lastAnalyzedAt" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TelemetryAnalysisCheckpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TelemetryAnalysisCheckpoint_sessionId_key" ON "TelemetryAnalysisCheckpoint"("sessionId");
