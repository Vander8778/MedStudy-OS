import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { serializeJson } from "../../common/backend-utils";
import type { AiAuditLogEntry } from "../types";

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AiRequestLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDb(db?: DbClient) {
    return db ?? this.prisma;
  }

  async save(entry: AiAuditLogEntry, db?: DbClient) {
    await this.getDb(db).aiRequestLog.create({
      data: {
        requestId: entry.requestId,
        capabilityKey: entry.capabilityKey,
        promptKey: entry.promptKey,
        promptVersion: entry.promptVersion,
        model: entry.model,
        inputSummaryJson: serializeJson(entry.inputSummary),
        validatedOutputJson:
          entry.validatedOutput === undefined
            ? null
            : serializeJson(entry.validatedOutput),
        rawOutputText: entry.rawOutput ?? null,
        status: entry.status,
        attemptCount: entry.attemptCount,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        totalLatencyMs: entry.totalLatencyMs,
        sessionId: entry.sessionId ?? null,
        userId: entry.userId ?? null,
        createdAt: new Date()
      }
    });
  }
}
