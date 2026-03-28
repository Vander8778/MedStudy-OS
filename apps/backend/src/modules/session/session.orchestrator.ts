import {
  BadRequestException,
  Injectable
} from "@nestjs/common";
import {
  evaluateContractRules,
  isOutcomeDecided,
  scoreSession,
  transition,
  type AntiAvoidanceResult,
  type Artifact,
  type Checkpoint,
  type ContractRuleEvaluationInput,
  type Penalty,
  type ResumeReason,
  type ScoringInput,
  type Session,
  type SessionEvent,
  type SessionMachineEvent,
  type SessionMachineContext,
  type TimeoutReason
} from "@medstudy/domain";
import { createId } from "../../common/backend-utils";
import { AuditService } from "../audit/audit.service";
import { ContractService } from "../contract/contract.service";
import { NotificationService } from "../notification/notification.service";
import { TimerService } from "../timer/timer.service";
import { SessionRepository, type SessionAggregate } from "./session.repository";

export type CreateSessionCommand = {
  userId: string;
  profileId: string;
  contractId: string;
  title: string;
  objective: string;
  plannedRange: {
    startsAt: string;
    endsAt: string;
  };
  finalArtifactRequired: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type SessionActionActor = {
  actorType: "user" | "system" | "admin" | "ai_assistant";
  userId?: string;
  label?: string;
};

type SessionActionOptions = {
  reason?: string;
  context?: SessionMachineContext;
  actor?: SessionActionActor;
};

type ReviewEvidenceSnapshot = {
  submittedArtifactTypes: readonly Artifact["type"][];
  latestVivaScore?: number;
  vivaRequired: boolean;
  vivaAttempted: boolean;
  totalPauseMinutes: number;
};

@Injectable()
export class SessionOrchestrator {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly auditService: AuditService,
    private readonly timerService: TimerService,
    private readonly notificationService: NotificationService,
    private readonly contractService: ContractService
  ) {}

  private buildSessionEvent(
    sessionId: string,
    machineEvent: SessionMachineEvent,
    actor?: SessionActionActor,
    state?: Session["state"]
  ): SessionEvent {
    return {
      id: machineEvent.id as SessionEvent["id"],
      sessionId: sessionId as SessionEvent["sessionId"],
      type: machineEvent.type as SessionEvent["type"],
      actor: {
        actorType: (actor?.actorType ?? machineEvent.actorType ?? "system") as SessionEvent["actor"]["actorType"],
        userId: actor?.userId as SessionEvent["actor"]["userId"],
        label: actor?.label
      },
      state,
      occurredAt: machineEvent.occurredAt as SessionEvent["occurredAt"],
      details: machineEvent.type === "resumed" || machineEvent.type === "timeout"
        ? { reason: machineEvent.reason }
        : undefined
    };
  }

  private createMachineEvent(
    type: "resumed",
    actor: SessionActionActor | undefined,
    reason: ResumeReason
  ): Extract<SessionMachineEvent, { type: "resumed" }>;
  private createMachineEvent(
    type: "timeout",
    actor: SessionActionActor | undefined,
    reason: TimeoutReason
  ): Extract<SessionMachineEvent, { type: "timeout" }>;
  private createMachineEvent(
    type: Exclude<SessionMachineEvent["type"], "resumed" | "timeout">,
    actor?: SessionActionActor
  ): SessionMachineEvent;
  private createMachineEvent(
    type: SessionMachineEvent["type"],
    actor?: SessionActionActor,
    reason?: ResumeReason | TimeoutReason
  ): SessionMachineEvent {
    const base = {
      id: createId("session_event"),
      occurredAt: new Date().toISOString() as Session["createdAt"],
      actorType: actor?.actorType
    } as const;

    switch (type) {
      case "resumed":
        return {
          ...base,
          type: "resumed",
          reason
        };
      case "timeout":
        return {
          ...base,
          type: "timeout",
          reason
        };
      case "excused":
        return {
          ...base,
          type: "excused",
          actorType: actor?.actorType ?? "admin"
        };
      default:
        return {
          ...base,
          type
        } as SessionMachineEvent;
    }
  }

  private assertTransitionSucceeded(result: ReturnType<typeof transition>) {
    if (!result.ok) {
      throw new BadRequestException(result.reason);
    }

    return result;
  }

  private scheduleSessionTimers(aggregate: SessionAggregate) {
    this.timerService.scheduleCheckpointDueChecks(
      aggregate.session.id,
      aggregate.checkpoints,
      async (sessionId) => {
        const freshAggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId);
        this.notificationService.notify({
          channel: "in_app",
          type: "checkpoint_due",
          userId: freshAggregate.session.userId,
          sessionId,
          message: "A scheduled checkpoint is now due."
        });
      }
    );

    this.timerService.scheduleSessionReview(
      aggregate.session.id,
      aggregate.session.plannedRange.endsAt,
      async (sessionId) => {
        await this.requestReview(sessionId, {
          actor: { actorType: "system", label: "timer.session_end" }
        });
      }
    );

    this.timerService.schedulePeriodicAvoidanceCheck(
      aggregate.session.id,
      5,
      async (sessionId) => {
        const freshAggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId);
        this.notificationService.notify({
          channel: "in_app",
          type: "system_message",
          userId: freshAggregate.session.userId,
          sessionId,
          message: "Periodic avoidance check trigger fired."
        });
      }
    );
  }

  private schedulePauseExpiry(aggregate: SessionAggregate) {
    if (aggregate.contract.terms.maxPauseMinutes === undefined) {
      return;
    }

    this.timerService.schedulePauseLimitExpiry(
      aggregate.session.id,
      aggregate.contract.terms.maxPauseMinutes,
      async (sessionId) => {
        await this.dispatchSessionMutation(
          sessionId,
          this.createMachineEvent("timeout", { actorType: "system" }, "pause_limit_exceeded"),
          {
            context: {}
          }
        );
      }
    );
  }

  private scheduleWarningExpiry(sessionId: string) {
    this.timerService.scheduleWarningGraceExpiry(sessionId, 5, async (freshSessionId) => {
      await this.dispatchSessionMutation(
        freshSessionId,
        this.createMachineEvent("timeout", { actorType: "system" }, "warning_grace_expired"),
        {
          context: {}
        }
      );
    });
  }

  private getSubmittedArtifactTypes(aggregate: SessionAggregate): readonly Artifact["type"][] {
    return aggregate.artifacts
      .filter((artifact) => artifact.status === "submitted" || artifact.status === "accepted")
      .map((artifact) => artifact.type);
  }

  private getLatestVivaScore(aggregate: SessionAggregate): number | undefined {
    const latestViva = [...aggregate.vivaAttempts]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];

    return latestViva?.score;
  }

  private getTotalPauseMinutes(aggregate: SessionAggregate): number {
    return aggregate.blocks
      .filter((block) => block.type === "pause")
      .reduce((totalMinutes, block) => {
        const rangeMinutes =
          (Date.parse(block.range.endsAt) - Date.parse(block.range.startsAt)) / 60000;

        return totalMinutes + Math.max(rangeMinutes, 0);
      }, 0);
  }

  private buildReviewEvidenceSnapshot(aggregate: SessionAggregate): ReviewEvidenceSnapshot {
    return {
      submittedArtifactTypes: this.getSubmittedArtifactTypes(aggregate),
      latestVivaScore: this.getLatestVivaScore(aggregate),
      vivaRequired: aggregate.vivaAttempts.length > 0,
      vivaAttempted: aggregate.vivaAttempts.length > 0,
      totalPauseMinutes: this.getTotalPauseMinutes(aggregate)
    };
  }

  private buildContractEvaluationInput(
    aggregate: SessionAggregate,
    evidence: ReviewEvidenceSnapshot
  ): ContractRuleEvaluationInput {
    const mandatoryFinalArtifactMissing =
      aggregate.session.finalArtifactRequired &&
      !evidence.submittedArtifactTypes.includes("final_submission" as Artifact["type"]);

    return {
      contract: {
        minValidMinutes: aggregate.contract.terms.minValidMinutes,
        maxMissedCheckpoints: aggregate.contract.terms.maxMissedCheckpoints,
        mandatoryArtifactTypes: aggregate.contract.terms.mandatoryArtifactTypes,
        vivaPassingScore: aggregate.contract.terms.vivaPassingScore,
        checkpointIntervalMinutes: aggregate.contract.terms.checkpointIntervalMinutes,
        maxPauseMinutes: aggregate.contract.terms.maxPauseMinutes
      },
      session: {
        validMinutes: aggregate.session.validMinutes,
        invalidMinutes: aggregate.session.invalidMinutes,
        plannedDurationMinutes: aggregate.session.plannedRange.startsAt && aggregate.session.plannedRange.endsAt
          ? (Date.parse(aggregate.session.plannedRange.endsAt) - Date.parse(aggregate.session.plannedRange.startsAt)) / 60000
          : 0,
        warningCount: aggregate.session.warningCount,
        missedCheckpointCount: aggregate.session.missedCheckpointCount,
        totalCheckpointCount: aggregate.checkpoints.length,
        totalPauseMinutes: evidence.totalPauseMinutes,
        finalArtifactRequired: aggregate.session.finalArtifactRequired,
        submittedArtifactTypes: evidence.submittedArtifactTypes
      },
      signals: {
        mandatoryFinalArtifactMissing,
        vivaScore: evidence.latestVivaScore,
        vivaRequired: evidence.vivaRequired,
        vivaAttempted: evidence.vivaAttempted
      }
    };
  }

  private getMandatoryFinalArtifactMissing(
    contractEvaluation: ReturnType<typeof evaluateContractRules>
  ): boolean {
    const artifactRule = contractEvaluation.rules.find(
      (rule) =>
        rule.code === "mandatory_artifacts_missing" ||
        rule.code === "mandatory_artifacts_complete"
    );

    return artifactRule?.details?.mandatoryFinalArtifactMissing === true;
  }

  private buildScoringInput(
    aggregate: SessionAggregate,
    contractEvaluation: ReturnType<typeof evaluateContractRules>,
    evidence: ReviewEvidenceSnapshot
  ): ScoringInput {
    const validTimeScore = Math.min(
      100,
      (aggregate.session.validMinutes / Math.max(aggregate.contract.terms.minValidMinutes, 1)) * 100
    );
    const processScore = Math.max(
      0,
      100 - aggregate.session.warningCount * 10 - aggregate.session.missedCheckpointCount * 20
    );
    const submittedMandatoryCount = aggregate.contract.terms.mandatoryArtifactTypes.filter((type) =>
      aggregate.artifacts.some(
        (artifact) =>
          artifact.type === type &&
          (artifact.status === "submitted" || artifact.status === "accepted")
      )
    ).length;
    const artifactScore =
      aggregate.contract.terms.mandatoryArtifactTypes.length === 0
        ? 100
        : (submittedMandatoryCount / aggregate.contract.terms.mandatoryArtifactTypes.length) * 100;
    const knowledgeScore = evidence.latestVivaScore ?? 100;
    const mandatoryFinalArtifactMissing =
      this.getMandatoryFinalArtifactMissing(contractEvaluation);

    return {
      contract: {
        minValidMinutes: aggregate.contract.terms.minValidMinutes,
        maxMissedCheckpoints: aggregate.contract.terms.maxMissedCheckpoints,
        mandatoryArtifactTypes: aggregate.contract.terms.mandatoryArtifactTypes,
        vivaPassingScore: aggregate.contract.terms.vivaPassingScore
      },
      session: {
        validMinutes: aggregate.session.validMinutes,
        invalidMinutes: aggregate.session.invalidMinutes,
        plannedDurationMinutes:
          (Date.parse(aggregate.session.plannedRange.endsAt) -
            Date.parse(aggregate.session.plannedRange.startsAt)) /
          60000,
        warningCount: aggregate.session.warningCount,
        missedCheckpointCount: aggregate.session.missedCheckpointCount,
        totalCheckpointCount: aggregate.checkpoints.length,
        finalArtifactRequired: aggregate.session.finalArtifactRequired
      },
      components: {
        validTimeScore,
        processScore,
        artifactScore,
        knowledgeScore
      },
      hardFailSignals: {
        mandatoryFinalArtifactMissing,
        criticalContractViolation: contractEvaluation.hasCriticalViolation,
        vivaScore: evidence.latestVivaScore
      }
    };
  }

  private mapScoringOutcomeToMachineEvent(outcome: "completed" | "partial" | "failed") {
    return outcome;
  }

  private buildCheckpointsForSession(session: Session, intervalMinutes?: number): Checkpoint[] {
    if (!intervalMinutes || intervalMinutes <= 0) {
      return [];
    }

    const checkpoints: Checkpoint[] = [];
    const startsAt = Date.parse(session.plannedRange.startsAt);
    const endsAt = Date.parse(session.plannedRange.endsAt);
    const plannedDurationMinutes = (endsAt - startsAt) / 60000;
    const checkpointCount = Math.floor(plannedDurationMinutes / intervalMinutes);

    for (let index = 1; index <= checkpointCount; index += 1) {
      const dueAt = new Date(startsAt + intervalMinutes * index * 60000).toISOString();

      checkpoints.push({
        id: createId("checkpoint") as Checkpoint["id"],
        sessionId: session.id,
        order: index,
        title: `Checkpoint ${index}`,
        status: "pending",
        dueAt: dueAt as Checkpoint["dueAt"],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      });
    }

    return checkpoints;
  }

  async createSession(command: CreateSessionCommand) {
    const contract = await this.contractService.getContract(command.contractId);
    const now = new Date().toISOString();
    const session: Session = {
      id: createId("session") as Session["id"],
      userId: command.userId as Session["userId"],
      profileId: command.profileId as Session["profileId"],
      contractId: command.contractId as Session["contractId"],
      title: command.title,
      objective: command.objective,
      state: "planned",
      plannedRange: {
        startsAt: command.plannedRange.startsAt as Session["plannedRange"]["startsAt"],
        endsAt: command.plannedRange.endsAt as Session["plannedRange"]["endsAt"]
      },
      validMinutes: 0 as Session["validMinutes"],
      invalidMinutes: 0 as Session["invalidMinutes"],
      warningCount: 0,
      missedCheckpointCount: 0,
      finalArtifactRequired: command.finalArtifactRequired,
      blockIds: [],
      checkpointIds: [],
      artifactIds: [],
      evaluationIds: [],
      vivaAttemptIds: [],
      penaltyIds: [],
      notes: command.notes,
      metadata: command.metadata,
      createdAt: now as Session["createdAt"],
      updatedAt: now as Session["updatedAt"]
    };

    const checkpoints = this.buildCheckpointsForSession(
      session,
      contract.terms.checkpointIntervalMinutes
    );
    const plannedEvent: SessionEvent = {
      id: createId("session_event") as SessionEvent["id"],
      sessionId: session.id,
      type: "planned",
      actor: { actorType: "system", label: "session.create" },
      state: "planned",
      occurredAt: session.createdAt
    };

    await this.sessionRepository.createSessionBundle(session, checkpoints, [plannedEvent]);
    return this.sessionRepository.findSessionAggregateOrThrow(session.id);
  }

  async getSession(sessionId: string) {
    return this.sessionRepository.findSessionAggregateOrThrow(sessionId);
  }

  async getSessionScoring(sessionId: string) {
    return this.sessionRepository.getLatestScoring(sessionId);
  }

  async getSessionEvents(sessionId: string) {
    return this.sessionRepository.listSessionEvents(sessionId);
  }

  async dispatchSessionMutation(
    sessionId: string,
    machineEvent: SessionMachineEvent,
    options: SessionActionOptions = {}
  ) {
    return this.sessionRepository.withTransaction(async (db) => {
      const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId, db);
      const result = this.assertTransitionSucceeded(
        transition(
          aggregate.session,
          machineEvent,
          aggregate.contract,
          options.context ?? {}
        )
      );

      await this.sessionRepository.saveSession(result.session, db);
      await this.sessionRepository.saveSessionEvent(
        this.buildSessionEvent(sessionId, machineEvent, options.actor, result.toState),
        db
      );
      await this.auditService.saveDomainEvents(result.domainEvents, db);

      if (aggregate.session.state === "active_warning" && result.toState !== "active_warning") {
        this.timerService.cancelWarningGraceExpiry(sessionId);
      }

      if (aggregate.session.state === "paused_valid" && result.toState !== "paused_valid") {
        this.timerService.cancelPauseLimitExpiry(sessionId);
      }

      if (
        result.toState === "review_pending" ||
        result.toState === "completed" ||
        result.toState === "partial" ||
        result.toState === "failed" ||
        result.toState === "penalized" ||
        result.toState === "excused"
      ) {
        this.timerService.clearAllForSession(sessionId);
      }

      if (result.toState === "active_valid") {
        this.scheduleSessionTimers({
          ...aggregate,
          session: result.session
        });
      }

      if (result.toState === "paused_valid") {
        this.schedulePauseExpiry({
          ...aggregate,
          session: result.session
        });
      }

      return result.session;
    });
  }

  armSession(sessionId: string, actor?: SessionActionActor) {
    return this.dispatchSessionMutation(
      sessionId,
      this.createMachineEvent("arming_started", actor),
      { actor }
    );
  }

  confirmArmSession(sessionId: string, actor?: SessionActionActor) {
    return this.dispatchSessionMutation(
      sessionId,
      this.createMachineEvent("armed", actor),
      { actor }
    );
  }

  startSession(sessionId: string, actor?: SessionActionActor) {
    return this.dispatchSessionMutation(
      sessionId,
      this.createMachineEvent("started", actor),
      { actor }
    );
  }

  pauseSession(sessionId: string, actor?: SessionActionActor) {
    return this.dispatchSessionMutation(
      sessionId,
      this.createMachineEvent("paused", actor),
      {
        actor,
        context: {
          totalPauseDuration: 0 as SessionMachineContext["totalPauseDuration"]
        }
      }
    );
  }

  resumeSession(sessionId: string, reason: "warning_resolved" | "pause_within_limit" | "manual_clear" | "admin_clear", actor?: SessionActionActor) {
    const context: SessionMachineContext =
      reason === "warning_resolved"
        ? { warningResolvedInGraceWindow: true }
        : reason === "pause_within_limit"
          ? { pauseWithinLimit: true }
          : { invalidBlockCleared: true };

    return this.dispatchSessionMutation(
      sessionId,
      this.createMachineEvent("resumed", actor, reason),
      {
        actor,
        context
      }
    );
  }

  async submitArtifact(
    sessionId: string,
    input: Pick<Artifact, "type" | "title" | "source" | "status"> & {
      createdByUserId?: string;
      description?: string;
      uri?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    // Artifact submission is intentionally modeled as a persisted side-effect plus audit event.
    // Checkpoint satisfaction stays outside this MVP and will be integrated later by orchestration.
    return this.sessionRepository.withTransaction(async (db) => {
      const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId, db);
      const now = new Date().toISOString();
      const artifact: Artifact = {
        id: createId("artifact") as Artifact["id"],
        sessionId: aggregate.session.id,
        type: input.type,
        source: input.source,
        status: input.status,
        title: input.title,
        description: input.description,
        isMandatory: aggregate.contract.terms.mandatoryArtifactTypes.includes(input.type),
        createdByUserId: input.createdByUserId as Artifact["createdByUserId"],
        submittedAt: now as Artifact["submittedAt"],
        uri: input.uri as Artifact["uri"],
        metadata: input.metadata,
        createdAt: now as Artifact["createdAt"],
        updatedAt: now as Artifact["updatedAt"]
      };
      const event: SessionEvent = {
        id: createId("session_event") as SessionEvent["id"],
        sessionId: aggregate.session.id,
        type: "artifact_submitted",
        actor: {
          actorType: input.createdByUserId ? "user" : "system",
          userId: input.createdByUserId as SessionEvent["actor"]["userId"],
          label: "session.submit_artifact"
        },
        state: aggregate.session.state,
        occurredAt: now as SessionEvent["occurredAt"],
        details: {
          artifactId: artifact.id,
          artifactType: artifact.type,
          artifactStatus: artifact.status
        }
      };

      await this.sessionRepository.createArtifact(artifact, db);
      await this.sessionRepository.saveSessionEvent(event, db);
      return artifact;
    });
  }

  async requestReview(sessionId: string, options: { actor?: SessionActionActor } = {}) {
    const result = await this.sessionRepository.withTransaction(async (db) => {
      const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId, db);

      if (aggregate.session.state === "review_pending") {
        throw new BadRequestException(
          `Session ${sessionId} already has a review in progress.`
        );
      }

      if (isOutcomeDecided(aggregate.session.state)) {
        throw new BadRequestException(
          `Session ${sessionId} already has a decided outcome (${aggregate.session.state}).`
        );
      }

      const reviewEvent = this.createMachineEvent("review_requested", options.actor);
      const reviewTransition = this.assertTransitionSucceeded(
        transition(aggregate.session, reviewEvent, aggregate.contract, {})
      );

      await this.sessionRepository.saveSession(reviewTransition.session, db);
      await this.sessionRepository.saveSessionEvent(
        this.buildSessionEvent(sessionId, reviewEvent, options.actor, reviewTransition.toState),
        db
      );
      await this.auditService.saveDomainEvents(reviewTransition.domainEvents, db);

      const reviewAggregate: SessionAggregate = {
        ...aggregate,
        session: reviewTransition.session
      };
      const evidence = this.buildReviewEvidenceSnapshot(reviewAggregate);
      const contractEvaluationInput = this.buildContractEvaluationInput(
        reviewAggregate,
        evidence
      );
      const contractEvaluation = evaluateContractRules(contractEvaluationInput);
      const scoringInput = this.buildScoringInput(
        reviewAggregate,
        contractEvaluation,
        evidence
      );
      const scoringResult = scoreSession(scoringInput);

      if (!scoringResult.ok) {
        throw new BadRequestException(scoringResult.reason);
      }

      const outcomeEventType = this.mapScoringOutcomeToMachineEvent(scoringResult.result.outcome);
      const outcomeEvent = this.createMachineEvent(outcomeEventType, options.actor);
      const outcomeTransition = this.assertTransitionSucceeded(
        transition(reviewTransition.session, outcomeEvent, aggregate.contract, {})
      );

      await this.sessionRepository.saveSession(outcomeTransition.session, db);
      await this.sessionRepository.saveSessionEvent(
        this.buildSessionEvent(sessionId, outcomeEvent, options.actor, outcomeTransition.toState),
        db
      );
      await this.auditService.saveDomainEvents(outcomeTransition.domainEvents, db);
      await this.auditService.saveContractEvaluation(sessionId, contractEvaluation, db);
      await this.auditService.saveScoringResult(sessionId, scoringResult.result, db);

      return {
        session: outcomeTransition.session,
        contractEvaluation,
        scoring: scoringResult.result
      };
    });

    this.timerService.clearAllForSession(sessionId);
    return result;
  }

  async penalizeSession(sessionId: string, actor?: SessionActionActor) {
    const result = await this.sessionRepository.withTransaction(async (db) => {
      const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId, db);
      const effectiveActor = actor ?? { actorType: "admin" as const };
      const penalizeEvent = this.createMachineEvent("penalized", effectiveActor);
      const result = this.assertTransitionSucceeded(
        transition(aggregate.session, penalizeEvent, aggregate.contract, {})
      );
      const now = penalizeEvent.occurredAt;
      const penalty: Penalty = {
        id: createId("penalty") as Penalty["id"],
        userId: aggregate.session.userId,
        contractId: aggregate.session.contractId,
        sessionId: aggregate.session.id,
        type: "session_failure",
        reason: "contract_violation",
        status: "active",
        issuedAt: now as Penalty["issuedAt"],
        notes: "Administrative penalty applied through the backend orchestration flow.",
        createdAt: now as Penalty["createdAt"],
        updatedAt: now as Penalty["updatedAt"]
      };

      await this.sessionRepository.saveSession(result.session, db);
      await this.sessionRepository.saveSessionEvent(
        this.buildSessionEvent(sessionId, penalizeEvent, effectiveActor, result.toState),
        db
      );
      await this.sessionRepository.createPenaltyRecord(penalty, db);
      await this.auditService.saveDomainEvents(result.domainEvents, db);

      return result.session;
    });

    this.timerService.clearAllForSession(sessionId);
    return result;
  }

  async excuseSession(sessionId: string, actor?: SessionActionActor) {
    return this.dispatchSessionMutation(
      sessionId,
      this.createMachineEvent("excused", actor ?? { actorType: "admin" }),
      { actor }
    );
  }

  async processAvoidanceAssessment(sessionId: string, assessment: AntiAvoidanceResult) {
    // MVP note: this flow is intentionally not a single cross-step transaction.
    // We persist the avoidance assessment first, then route follow-up actions through their
    // own orchestrated transactions so session lifecycle mutations still go through M2.
    await this.auditService.saveAntiAvoidanceResult(sessionId, assessment);

    if (assessment.recommendedResponses.includes("raise_warning")) {
      await this.dispatchSessionMutation(
        sessionId,
        this.createMachineEvent("warning_raised", { actorType: "system", label: "avoidance.raise_warning" }),
        { actor: { actorType: "system", label: "avoidance.raise_warning" } }
      );
      this.scheduleWarningExpiry(sessionId);
    }

    if (assessment.recommendedResponses.includes("escalate_to_review")) {
      await this.requestReview(sessionId, {
        actor: { actorType: "system", label: "avoidance.escalate_to_review" }
      });
    }

    if (assessment.recommendedResponses.includes("flag_for_admin")) {
      const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId);
      this.notificationService.notify({
        channel: "in_app",
        type: "avoidance.flag_for_admin",
        userId: aggregate.session.userId,
        sessionId,
        message: "Session requires admin review due to critical avoidance signals."
      });
    }

    return assessment;
  }
}
