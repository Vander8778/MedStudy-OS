CREATE TABLE "AiRequestLog" (
    "requestId" TEXT NOT NULL PRIMARY KEY,
    "capabilityKey" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputSummaryJson" TEXT NOT NULL,
    "validatedOutputJson" TEXT,
    "rawOutputText" TEXT,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalLatencyMs" INTEGER NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL
);

CREATE INDEX "AiRequestLog_capabilityKey_createdAt_idx" ON "AiRequestLog"("capabilityKey", "createdAt");
CREATE INDEX "AiRequestLog_sessionId_createdAt_idx" ON "AiRequestLog"("sessionId", "createdAt");
CREATE INDEX "AiRequestLog_userId_createdAt_idx" ON "AiRequestLog"("userId", "createdAt");
