import { Injectable } from "@nestjs/common";
import type {
  ContractEvaluationResult as DomainContractEvaluationResult,
  DomainEvent,
  ScoringResult as DomainScoringResult,
  AntiAvoidanceResult as DomainAntiAvoidanceResult
} from "@medstudy/domain";
import type { Prisma } from "@prisma/client";
import { AuditRepository } from "./audit.repository";

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  saveDomainEvents(events: readonly DomainEvent[], db?: Prisma.TransactionClient) {
    return this.auditRepository.saveDomainEvents(events, db);
  }

  saveScoringResult(
    sessionId: string,
    result: DomainScoringResult,
    db?: Prisma.TransactionClient
  ) {
    return this.auditRepository.saveScoringResult(sessionId, result, db);
  }

  saveContractEvaluation(
    sessionId: string,
    result: DomainContractEvaluationResult,
    db?: Prisma.TransactionClient
  ) {
    return this.auditRepository.saveContractEvaluation(sessionId, result, db);
  }

  saveAntiAvoidanceResult(
    sessionId: string,
    result: DomainAntiAvoidanceResult,
    db?: Prisma.TransactionClient
  ) {
    return this.auditRepository.saveAntiAvoidanceResult(sessionId, result, db);
  }
}
