import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { createId, fromDate, parseJson, serializeJson, toDate } from "../../common/backend-utils";

type DbClient = PrismaService | Prisma.TransactionClient;

export type TelemetryEventRecord = {
  id: string;
  userId: string;
  sessionId?: string;
  clientEventId?: string;
  source: "desktop" | "mobile" | "web_admin" | "backend" | "system";
  type:
    | "heartbeat"
    | "focus_changed"
    | "input_activity"
    | "idle_detected"
    | "window_changed"
    | "url_changed"
    | "process_snapshot"
    | "manual_note";
  occurredAt: string;
  receivedAt: string;
  serverReceivedAt: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CreateTelemetryEventCommand = {
  userId: string;
  sessionId?: string;
  clientEventId?: string;
  source: TelemetryEventRecord["source"];
  type: TelemetryEventRecord["type"];
  occurredAt: string;
  receivedAt: string;
  serverReceivedAt: string;
  payload: Record<string, unknown>;
};

export type CreateTelemetryEventResult = {
  event: TelemetryEventRecord;
  duplicate: boolean;
};

export type TelemetrySummaryRecord = {
  id: string;
  sessionId: string;
  windowStartsAt: string;
  windowEndsAt: string;
  rawEventCount: number;
  lastRawEventId: string;
  idleMinutes: number;
  longestIdleStretchMinutes: number;
  contextSwitchCount: number;
  nonStudyContextMinutes: number;
  nonStudyContextDetected: boolean;
  inputActivityLevel: "none" | "minimal" | "normal";
  sessionElapsedMinutes: number;
  sessionValidMinutes: number;
  sessionInvalidMinutes: number;
  sessionWarningCount: number;
  sessionMissedCheckpointCount: number;
  currentWarningActive: boolean;
  currentWarningDurationMinutes: number;
  createdAt: string;
};

export type TelemetryAnalysisCheckpointRecord = {
  id: string;
  sessionId: string;
  lastProcessedRawEventId?: string;
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class TelemetryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDb(db?: DbClient) {
    return db ?? this.prisma;
  }

  private mapEvent(record: {
    id: string;
    userId: string;
    sessionId: string | null;
    clientEventId: string | null;
    source: string;
    type: string;
    occurredAt: Date;
    receivedAt: Date;
    serverReceivedAt: Date;
    payloadJson: string;
    createdAt: Date;
  }): TelemetryEventRecord {
    return {
      id: record.id,
      userId: record.userId,
      sessionId: record.sessionId ?? undefined,
      clientEventId: record.clientEventId ?? undefined,
      source: record.source as TelemetryEventRecord["source"],
      type: record.type as TelemetryEventRecord["type"],
      occurredAt: record.occurredAt.toISOString(),
      receivedAt: record.receivedAt.toISOString(),
      serverReceivedAt: record.serverReceivedAt.toISOString(),
      payload: parseJson(record.payloadJson, {}),
      createdAt: record.createdAt.toISOString()
    };
  }

  private mapCheckpoint(record: {
    id: string;
    sessionId: string;
    lastProcessedRawEventId: string | null;
    lastAnalyzedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): TelemetryAnalysisCheckpointRecord {
    return {
      id: record.id,
      sessionId: record.sessionId,
      lastProcessedRawEventId: record.lastProcessedRawEventId ?? undefined,
      lastAnalyzedAt: fromDate(record.lastAnalyzedAt) ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  async createEvent(
    command: CreateTelemetryEventCommand,
    db?: DbClient
  ): Promise<CreateTelemetryEventResult> {
    if (command.sessionId && command.clientEventId) {
      const existing = await this.getDb(db).telemetryEvent.findUnique({
        where: {
          sessionId_clientEventId: {
            sessionId: command.sessionId,
            clientEventId: command.clientEventId
          }
        }
      });

      if (existing) {
        return {
          event: this.mapEvent(existing),
          duplicate: true
        };
      }
    }

    const record = await this.getDb(db).telemetryEvent.create({
      data: {
        id: createId("telemetry"),
        userId: command.userId,
        sessionId: command.sessionId,
        clientEventId: command.clientEventId,
        source: command.source,
        type: command.type,
        occurredAt: toDate(command.occurredAt),
        receivedAt: toDate(command.receivedAt),
        serverReceivedAt: toDate(command.serverReceivedAt),
        payloadJson: serializeJson(command.payload),
        createdAt: new Date()
      }
    });

    return {
      event: this.mapEvent(record),
      duplicate: false
    };
  }

  async createBatch(
    commands: readonly CreateTelemetryEventCommand[],
    db?: DbClient
  ): Promise<readonly CreateTelemetryEventResult[]> {
    const results: CreateTelemetryEventResult[] = [];

    for (const command of commands) {
      results.push(await this.createEvent(command, db));
    }

    return results;
  }

  async getOrCreateCheckpoint(
    sessionId: string,
    db?: DbClient
  ): Promise<TelemetryAnalysisCheckpointRecord> {
    const executor = this.getDb(db);
    const existing = await executor.telemetryAnalysisCheckpoint.findUnique({
      where: { sessionId }
    });

    if (existing) {
      return this.mapCheckpoint(existing);
    }

    const now = new Date();
    const record = await executor.telemetryAnalysisCheckpoint.create({
      data: {
        id: createId("telemetry_checkpoint"),
        sessionId,
        createdAt: now,
        updatedAt: now
      }
    });

    return this.mapCheckpoint(record);
  }

  async findEventsSinceCheckpoint(
    sessionId: string,
    checkpoint: TelemetryAnalysisCheckpointRecord,
    db?: DbClient
  ): Promise<readonly TelemetryEventRecord[]> {
    const records = await this.getDb(db).telemetryEvent.findMany({
      where: { sessionId },
      orderBy: [
        { serverReceivedAt: "asc" },
        { createdAt: "asc" }
      ]
    });
    const events = records.map((record) => this.mapEvent(record));

    if (!checkpoint.lastProcessedRawEventId) {
      return events;
    }

    const lastProcessedIndex = events.findIndex(
      (event) => event.id === checkpoint.lastProcessedRawEventId
    );

    return lastProcessedIndex === -1
      ? events
      : events.slice(lastProcessedIndex + 1);
  }

  async saveSummary(summary: TelemetrySummaryRecord, db?: DbClient) {
    await this.getDb(db).telemetrySummary.create({
      data: {
        id: summary.id,
        sessionId: summary.sessionId,
        windowStartsAt: toDate(summary.windowStartsAt),
        windowEndsAt: toDate(summary.windowEndsAt),
        rawEventCount: summary.rawEventCount,
        lastRawEventId: summary.lastRawEventId,
        idleMinutes: summary.idleMinutes,
        longestIdleStretchMinutes: summary.longestIdleStretchMinutes,
        contextSwitchCount: summary.contextSwitchCount,
        nonStudyContextMinutes: summary.nonStudyContextMinutes,
        nonStudyContextDetected: summary.nonStudyContextDetected,
        inputActivityLevel: summary.inputActivityLevel,
        sessionElapsedMinutes: summary.sessionElapsedMinutes,
        sessionValidMinutes: summary.sessionValidMinutes,
        sessionInvalidMinutes: summary.sessionInvalidMinutes,
        sessionWarningCount: summary.sessionWarningCount,
        sessionMissedCheckpointCount: summary.sessionMissedCheckpointCount,
        currentWarningActive: summary.currentWarningActive,
        currentWarningDurationMinutes: summary.currentWarningDurationMinutes,
        createdAt: toDate(summary.createdAt)
      }
    });

    return summary;
  }

  async findRecentSummary(sessionId: string, db?: DbClient) {
    const record = await this.getDb(db).telemetrySummary.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" }
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      sessionId: record.sessionId,
      windowStartsAt: record.windowStartsAt.toISOString(),
      windowEndsAt: record.windowEndsAt.toISOString(),
      rawEventCount: record.rawEventCount,
      lastRawEventId: record.lastRawEventId,
      idleMinutes: record.idleMinutes,
      longestIdleStretchMinutes: record.longestIdleStretchMinutes,
      contextSwitchCount: record.contextSwitchCount,
      nonStudyContextMinutes: record.nonStudyContextMinutes,
      nonStudyContextDetected: record.nonStudyContextDetected,
      inputActivityLevel: record.inputActivityLevel as TelemetrySummaryRecord["inputActivityLevel"],
      sessionElapsedMinutes: record.sessionElapsedMinutes,
      sessionValidMinutes: record.sessionValidMinutes,
      sessionInvalidMinutes: record.sessionInvalidMinutes,
      sessionWarningCount: record.sessionWarningCount,
      sessionMissedCheckpointCount: record.sessionMissedCheckpointCount,
      currentWarningActive: record.currentWarningActive,
      currentWarningDurationMinutes: record.currentWarningDurationMinutes,
      createdAt: record.createdAt.toISOString()
    } satisfies TelemetrySummaryRecord;
  }

  async advanceCheckpoint(
    sessionId: string,
    update: {
      lastProcessedRawEventId: string;
      lastAnalyzedAt: string;
    },
    db?: DbClient
  ) {
    const record = await this.getDb(db).telemetryAnalysisCheckpoint.upsert({
      where: { sessionId },
      update: {
        lastProcessedRawEventId: update.lastProcessedRawEventId,
        lastAnalyzedAt: toDate(update.lastAnalyzedAt),
        updatedAt: new Date()
      },
      create: {
        id: createId("telemetry_checkpoint"),
        sessionId,
        lastProcessedRawEventId: update.lastProcessedRawEventId,
        lastAnalyzedAt: toDate(update.lastAnalyzedAt),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return this.mapCheckpoint(record);
  }

  async countPreviousSessionAvoidanceResults(
    userId: string,
    currentSessionId: string,
    db?: DbClient
  ) {
    return this.getDb(db).antiAvoidanceResult.count({
      where: {
        sessionId: { not: currentSessionId },
        session: {
          userId
        }
      }
    });
  }
}
