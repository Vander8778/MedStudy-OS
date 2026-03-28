import { Injectable } from "@nestjs/common";
import type {
  ContractEvaluationResult as DomainContractEvaluationResult,
  DomainEvent,
  ScoringResult as DomainScoringResult,
  AntiAvoidanceResult as DomainAntiAvoidanceResult
} from "@medstudy/domain";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { createId, serializeJson } from "../../common/backend-utils";

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDb(db?: DbClient) {
    return db ?? this.prisma;
  }

  async saveDomainEvents(events: readonly DomainEvent[], db?: DbClient) {
    if (events.length === 0) {
      return;
    }

    await this.getDb(db).domainEvent.createMany({
      data: events.map((event) => ({
        id: event.id,
        sessionId: event.sessionId,
        type: event.type,
        occurredAt: new Date(event.occurredAt),
        payloadJson: serializeJson(event),
        createdAt: new Date()
      }))
    });
  }

  async saveScoringResult(
    sessionId: string,
    result: DomainScoringResult,
    db?: DbClient
  ) {
    await this.getDb(db).scoringResult.create({
      data: {
        id: createId("scoring"),
        sessionId,
        outcome: result.outcome,
        sessionScore: result.sessionScore,
        componentsJson: serializeJson(result.components),
        hardFailJson: serializeJson(result.hardFail),
        decisionTraceJson: serializeJson(result.decisionTrace),
        createdAt: new Date()
      }
    });
  }

  async saveContractEvaluation(
    sessionId: string,
    result: DomainContractEvaluationResult,
    db?: DbClient
  ) {
    await this.getDb(db).contractEvaluationResult.create({
      data: {
        id: createId("contract_eval"),
        sessionId,
        allRulesPassed: result.allRulesPassed,
        hasCriticalViolation: result.hasCriticalViolation,
        rulesJson: serializeJson(result.rules),
        criticalViolationsJson: serializeJson(result.criticalViolations),
        warningsJson: serializeJson(result.warnings),
        informationalJson: serializeJson(result.informational),
        createdAt: new Date()
      }
    });
  }

  async saveAntiAvoidanceResult(
    sessionId: string,
    result: DomainAntiAvoidanceResult,
    db?: DbClient
  ) {
    await this.getDb(db).antiAvoidanceResult.create({
      data: {
        id: createId("avoidance"),
        sessionId,
        overallSeverity: result.overallSeverity,
        hasEscalationSignal: result.hasEscalationSignal,
        patternsJson: serializeJson(result.patterns),
        recommendedResponsesJson: serializeJson(result.recommendedResponses),
        createdAt: new Date()
      }
    });
  }
}
