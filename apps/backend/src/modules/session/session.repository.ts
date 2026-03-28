import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  Artifact,
  Checkpoint,
  Contract,
  Penalty,
  ScoringResult,
  Session,
  SessionEvent,
  VivaAttempt
} from "@medstudy/domain";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { fromDate, parseJson, serializeJson, toDate } from "../../common/backend-utils";

export type SessionAggregate = {
  session: Session;
  contract: Contract;
  artifacts: readonly Artifact[];
  checkpoints: readonly Checkpoint[];
  vivaAttempts: readonly VivaAttempt[];
  penalties: readonly Penalty[];
  events: readonly SessionEvent[];
};

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDb(db?: DbClient) {
    return db ?? this.prisma;
  }

  withTransaction<T>(callback: (db: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction((db) => callback(db));
  }

  async ensureUserProfileExists(userId: string, profileId: string) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@medstudy.local`,
        role: "student",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await this.prisma.profile.upsert({
      where: { id: profileId },
      update: {},
      create: {
        id: profileId,
        userId,
        studyStage: "other",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async createSessionBundle(
    session: Session,
    checkpoints: readonly Checkpoint[],
    initialEvents: readonly SessionEvent[],
    db?: DbClient
  ) {
    await this.ensureUserProfileExists(session.userId, session.profileId);

    const executor = this.getDb(db);

    await executor.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        profileId: session.profileId,
        contractId: session.contractId,
        title: session.title,
        objective: session.objective,
        state: session.state,
        plannedRangeStartsAt: toDate(session.plannedRange.startsAt),
        plannedRangeEndsAt: toDate(session.plannedRange.endsAt),
        startedAt: session.startedAt ? toDate(session.startedAt) : null,
        endedAt: session.endedAt ? toDate(session.endedAt) : null,
        reviewRequestedAt: session.reviewRequestedAt ? toDate(session.reviewRequestedAt) : null,
        validMinutes: session.validMinutes,
        invalidMinutes: session.invalidMinutes,
        warningCount: session.warningCount,
        missedCheckpointCount: session.missedCheckpointCount,
        finalArtifactRequired: session.finalArtifactRequired,
        notes: session.notes,
        metadataJson: session.metadata ? serializeJson(session.metadata) : null,
        createdAt: toDate(session.createdAt),
        updatedAt: toDate(session.updatedAt)
      }
    });

    if (checkpoints.length > 0) {
      await executor.checkpoint.createMany({
        data: checkpoints.map((checkpoint) => ({
          id: checkpoint.id,
          sessionId: checkpoint.sessionId,
          orderIndex: checkpoint.order,
          title: checkpoint.title,
          status: checkpoint.status,
          dueAt: toDate(checkpoint.dueAt),
          completedAt: checkpoint.completedAt ? toDate(checkpoint.completedAt) : null,
          artifactId: checkpoint.artifactId,
          evaluationId: checkpoint.evaluationId,
          notes: checkpoint.notes,
          createdAt: toDate(checkpoint.createdAt),
          updatedAt: toDate(checkpoint.updatedAt)
        }))
      });
    }

    if (initialEvents.length > 0) {
      await executor.sessionEvent.createMany({
        data: initialEvents.map((event) => ({
          id: event.id,
          sessionId: event.sessionId,
          type: event.type,
          actorType: event.actor.actorType,
          actorUserId: event.actor.userId,
          actorLabel: event.actor.label,
          state: event.state,
          occurredAt: toDate(event.occurredAt),
          detailsJson: event.details ? serializeJson(event.details) : null
        }))
      });
    }

    return session;
  }

  async saveSession(session: Session, db?: DbClient) {
    await this.getDb(db).session.update({
      where: { id: session.id },
      data: {
        state: session.state,
        startedAt: session.startedAt ? toDate(session.startedAt) : null,
        endedAt: session.endedAt ? toDate(session.endedAt) : null,
        reviewRequestedAt: session.reviewRequestedAt ? toDate(session.reviewRequestedAt) : null,
        validMinutes: session.validMinutes,
        invalidMinutes: session.invalidMinutes,
        warningCount: session.warningCount,
        missedCheckpointCount: session.missedCheckpointCount,
        finalArtifactRequired: session.finalArtifactRequired,
        notes: session.notes,
        metadataJson: session.metadata ? serializeJson(session.metadata) : null,
        updatedAt: toDate(session.updatedAt)
      }
    });

    return session;
  }

  async saveSessionEvent(event: SessionEvent, db?: DbClient) {
    await this.getDb(db).sessionEvent.create({
      data: {
        id: event.id,
        sessionId: event.sessionId,
        type: event.type,
        actorType: event.actor.actorType,
        actorUserId: event.actor.userId,
        actorLabel: event.actor.label,
        state: event.state,
        occurredAt: toDate(event.occurredAt),
        detailsJson: event.details ? serializeJson(event.details) : null
      }
    });

    return event;
  }

  async createArtifact(artifact: Artifact, db?: DbClient) {
    await this.getDb(db).artifact.create({
      data: {
        id: artifact.id,
        sessionId: artifact.sessionId,
        type: artifact.type,
        source: artifact.source,
        status: artifact.status,
        title: artifact.title,
        description: artifact.description,
        isMandatory: artifact.isMandatory,
        createdByUserId: artifact.createdByUserId,
        submittedAt: artifact.submittedAt ? toDate(artifact.submittedAt) : null,
        mediaType: artifact.mediaType,
        uri: artifact.uri,
        metadataJson: artifact.metadata ? serializeJson(artifact.metadata) : null,
        createdAt: toDate(artifact.createdAt),
        updatedAt: toDate(artifact.updatedAt)
      }
    });

    return artifact;
  }

  async createPenaltyRecord(penalty: Penalty, db?: DbClient) {
    await this.getDb(db).penalty.create({
      data: {
        id: penalty.id,
        userId: penalty.userId,
        contractId: penalty.contractId ?? null,
        sessionId: penalty.sessionId ?? null,
        type: penalty.type,
        reason: penalty.reason,
        status: penalty.status,
        issuedAt: toDate(penalty.issuedAt),
        expiresAt: penalty.expiresAt ? toDate(penalty.expiresAt) : null,
        resolvedAt: penalty.resolvedAt ? toDate(penalty.resolvedAt) : null,
        notes: penalty.notes,
        metadataJson: penalty.metadata ? serializeJson(penalty.metadata) : null,
        createdAt: toDate(penalty.createdAt),
        updatedAt: toDate(penalty.updatedAt)
      }
    });
  }

  async listSessionEvents(sessionId: string): Promise<readonly SessionEvent[]> {
    const events = await this.prisma.sessionEvent.findMany({
      where: { sessionId },
      orderBy: { occurredAt: "asc" }
    });

    return events.map((event) => ({
      id: event.id as SessionEvent["id"],
      sessionId: event.sessionId as SessionEvent["sessionId"],
      type: event.type as SessionEvent["type"],
      actor: {
        actorType: event.actorType as SessionEvent["actor"]["actorType"],
        userId: event.actorUserId as SessionEvent["actor"]["userId"],
        label: event.actorLabel ?? undefined
      },
      state: event.state as SessionEvent["state"],
      occurredAt: event.occurredAt.toISOString() as SessionEvent["occurredAt"],
      details: parseJson(event.detailsJson, undefined)
    }));
  }

  async getLatestScoring(sessionId: string): Promise<ScoringResult | null> {
    const record = await this.prisma.scoringResult.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" }
    });

    if (!record) {
      return null;
    }

    return {
      outcome: record.outcome as ScoringResult["outcome"],
      sessionScore: record.sessionScore,
      components: parseJson(record.componentsJson, {}),
      hardFail: parseJson(record.hardFailJson, {}),
      decisionTrace: parseJson(record.decisionTraceJson, {})
    } as ScoringResult;
  }

  async findSessionAggregateOrThrow(sessionId: string, db?: DbClient): Promise<SessionAggregate> {
    const record = await this.getDb(db).session.findUnique({
      where: { id: sessionId },
      include: {
        contract: true,
        artifacts: true,
        checkpoints: true,
        vivaAttempts: true,
        penalties: true,
        events: {
          orderBy: { occurredAt: "asc" }
        }
      }
    });

    if (!record) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return {
      session: {
        id: record.id as Session["id"],
        userId: record.userId as Session["userId"],
        profileId: record.profileId as Session["profileId"],
        contractId: record.contractId as Session["contractId"],
        title: record.title,
        objective: record.objective,
        state: record.state as Session["state"],
        plannedRange: {
          startsAt: record.plannedRangeStartsAt.toISOString() as Session["plannedRange"]["startsAt"],
          endsAt: record.plannedRangeEndsAt.toISOString() as Session["plannedRange"]["endsAt"]
        },
        startedAt: fromDate(record.startedAt) as Session["startedAt"],
        endedAt: fromDate(record.endedAt) as Session["endedAt"],
        reviewRequestedAt: fromDate(record.reviewRequestedAt) as Session["reviewRequestedAt"],
        validMinutes: record.validMinutes as Session["validMinutes"],
        invalidMinutes: record.invalidMinutes as Session["invalidMinutes"],
        warningCount: record.warningCount,
        missedCheckpointCount: record.missedCheckpointCount,
        finalArtifactRequired: record.finalArtifactRequired,
        blockIds: [],
        checkpointIds: record.checkpoints.map((checkpoint) => checkpoint.id as Session["checkpointIds"][number]),
        artifactIds: record.artifacts.map((artifact) => artifact.id as Session["artifactIds"][number]),
        evaluationIds: [],
        vivaAttemptIds: record.vivaAttempts.map((attempt) => attempt.id as Session["vivaAttemptIds"][number]),
        penaltyIds: record.penalties.map((penalty) => penalty.id as Session["penaltyIds"][number]),
        notes: record.notes ?? undefined,
        metadata: parseJson(record.metadataJson, undefined),
        createdAt: record.createdAt.toISOString() as Session["createdAt"],
        updatedAt: record.updatedAt.toISOString() as Session["updatedAt"]
      },
      contract: {
        id: record.contract.id as Contract["id"],
        userId: record.contract.userId as Contract["userId"],
        name: record.contract.name,
        description: record.contract.description ?? undefined,
        status: record.contract.status as Contract["status"],
        terms: {
          minValidMinutes: record.contract.minValidMinutes as Contract["terms"]["minValidMinutes"],
          maxMissedCheckpoints: record.contract.maxMissedCheckpoints,
          mandatoryArtifactTypes: parseJson(record.contract.mandatoryArtifactTypesJson, []),
          vivaPassingScore: record.contract.vivaPassingScore as Contract["terms"]["vivaPassingScore"],
          checkpointIntervalMinutes:
            record.contract.checkpointIntervalMinutes === null
              ? undefined
              : (record.contract.checkpointIntervalMinutes as Contract["terms"]["checkpointIntervalMinutes"]),
          maxPauseMinutes:
            record.contract.maxPauseMinutes === null
              ? undefined
              : (record.contract.maxPauseMinutes as Contract["terms"]["maxPauseMinutes"])
        },
        activeRange: {
          startsAt: record.contract.activeRangeStartsAt.toISOString() as Contract["activeRange"]["startsAt"],
          endsAt: record.contract.activeRangeEndsAt.toISOString() as Contract["activeRange"]["endsAt"]
        },
        signedAt: fromDate(record.contract.signedAt) as Contract["signedAt"],
        activatedAt: fromDate(record.contract.activatedAt) as Contract["activatedAt"],
        endedAt: fromDate(record.contract.endedAt) as Contract["endedAt"],
        tags: parseJson(record.contract.tagsJson, []),
        metadata: parseJson(record.contract.metadataJson, undefined),
        createdAt: record.contract.createdAt.toISOString() as Contract["createdAt"],
        updatedAt: record.contract.updatedAt.toISOString() as Contract["updatedAt"]
      },
      artifacts: record.artifacts.map((artifact) => ({
        id: artifact.id as Artifact["id"],
        sessionId: artifact.sessionId as Artifact["sessionId"],
        type: artifact.type as Artifact["type"],
        source: artifact.source as Artifact["source"],
        status: artifact.status as Artifact["status"],
        title: artifact.title,
        description: artifact.description ?? undefined,
        isMandatory: artifact.isMandatory,
        createdByUserId: artifact.createdByUserId as Artifact["createdByUserId"],
        submittedAt: fromDate(artifact.submittedAt) as Artifact["submittedAt"],
        mediaType: artifact.mediaType ?? undefined,
        uri: artifact.uri as Artifact["uri"],
        metadata: parseJson(artifact.metadataJson, undefined),
        createdAt: artifact.createdAt.toISOString() as Artifact["createdAt"],
        updatedAt: artifact.updatedAt.toISOString() as Artifact["updatedAt"]
      })),
      checkpoints: record.checkpoints.map((checkpoint) => ({
        id: checkpoint.id as Checkpoint["id"],
        sessionId: checkpoint.sessionId as Checkpoint["sessionId"],
        order: checkpoint.orderIndex,
        title: checkpoint.title,
        status: checkpoint.status as Checkpoint["status"],
        dueAt: checkpoint.dueAt.toISOString() as Checkpoint["dueAt"],
        completedAt: fromDate(checkpoint.completedAt) as Checkpoint["completedAt"],
        artifactId: checkpoint.artifactId as Checkpoint["artifactId"],
        evaluationId: checkpoint.evaluationId as Checkpoint["evaluationId"],
        notes: checkpoint.notes ?? undefined,
        createdAt: checkpoint.createdAt.toISOString() as Checkpoint["createdAt"],
        updatedAt: checkpoint.updatedAt.toISOString() as Checkpoint["updatedAt"]
      })),
      vivaAttempts: record.vivaAttempts.map((attempt) => ({
        id: attempt.id as VivaAttempt["id"],
        sessionId: attempt.sessionId as VivaAttempt["sessionId"],
        promptTemplateId: attempt.promptTemplateId as VivaAttempt["promptTemplateId"],
        status: attempt.status as VivaAttempt["status"],
        scheduledAt: fromDate(attempt.scheduledAt) as VivaAttempt["scheduledAt"],
        startedAt: fromDate(attempt.startedAt) as VivaAttempt["startedAt"],
        completedAt: fromDate(attempt.completedAt) as VivaAttempt["completedAt"],
        transcriptArtifactId: attempt.transcriptArtifactId as VivaAttempt["transcriptArtifactId"],
        evaluationId: attempt.evaluationId as VivaAttempt["evaluationId"],
        score: attempt.score as VivaAttempt["score"],
        passingScore: attempt.passingScore as VivaAttempt["passingScore"],
        notes: attempt.notes ?? undefined,
        createdAt: attempt.createdAt.toISOString() as VivaAttempt["createdAt"],
        updatedAt: attempt.updatedAt.toISOString() as VivaAttempt["updatedAt"]
      })),
      penalties: record.penalties.map((penalty) => ({
        id: penalty.id as Penalty["id"],
        userId: penalty.userId as Penalty["userId"],
        contractId:
          penalty.contractId === null
            ? undefined
            : (penalty.contractId as Penalty["contractId"]),
        sessionId:
          penalty.sessionId === null
            ? undefined
            : (penalty.sessionId as Penalty["sessionId"]),
        type: penalty.type as Penalty["type"],
        reason: penalty.reason as Penalty["reason"],
        status: penalty.status as Penalty["status"],
        issuedAt: penalty.issuedAt.toISOString() as Penalty["issuedAt"],
        expiresAt: fromDate(penalty.expiresAt) as Penalty["expiresAt"],
        resolvedAt: fromDate(penalty.resolvedAt) as Penalty["resolvedAt"],
        notes: penalty.notes ?? undefined,
        metadata: parseJson(penalty.metadataJson, undefined),
        createdAt: penalty.createdAt.toISOString() as Penalty["createdAt"],
        updatedAt: penalty.updatedAt.toISOString() as Penalty["updatedAt"]
      })),
      events: record.events.map((event) => ({
        id: event.id as SessionEvent["id"],
        sessionId: event.sessionId as SessionEvent["sessionId"],
        type: event.type as SessionEvent["type"],
        actor: {
          actorType: event.actorType as SessionEvent["actor"]["actorType"],
          userId: event.actorUserId as SessionEvent["actor"]["userId"],
          label: event.actorLabel ?? undefined
        },
        state: event.state as SessionEvent["state"],
        occurredAt: event.occurredAt.toISOString() as SessionEvent["occurredAt"],
        details: parseJson(event.detailsJson, undefined)
      }))
    };
  }
}
