import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import type {
  CreateSessionRequest,
  RequestReviewRequest,
  ResumeSessionRequest,
  SessionActionRequest,
  SubmitArtifactRequest
} from "@medstudy/contracts";
import {
  mapGetEventsResponse,
  mapGetScoringResponse,
  mapGetSessionResponse,
  mapReviewResultResponse,
  mapSessionAggregateResponse,
  mapSessionMutationResponse,
  mapSubmitArtifactResponse
} from "../../common/view-mappers";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { requestReviewRequestSchema } from "./dto/request-review.dto";
import { createSessionRequestSchema } from "./dto/create-session.dto";
import { resumeSessionRequestSchema } from "./dto/resume-session.dto";
import { sessionActionRequestSchema } from "./dto/session-action.dto";
import { submitArtifactRequestSchema } from "./dto/submit-artifact.dto";
import { SessionOrchestrator } from "./session.orchestrator";

@Controller("sessions")
export class SessionController {
  constructor(
    @Inject(SessionOrchestrator)
    private readonly sessionOrchestrator: SessionOrchestrator
  ) {}

  @Post()
  async createSession(
    @Body(new ZodValidationPipe(createSessionRequestSchema)) body: CreateSessionRequest
  ) {
    return mapSessionAggregateResponse(await this.sessionOrchestrator.createSession(body));
  }

  @Get(":id")
  async getSession(@Param("id") id: string) {
    return mapGetSessionResponse(await this.sessionOrchestrator.getSession(id));
  }

  @Post(":id/arm")
  async armSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionActionRequestSchema)) body: SessionActionRequest
  ) {
    return mapSessionMutationResponse(await this.sessionOrchestrator.armSession(id, body.actor));
  }

  @Post(":id/confirm-arm")
  async confirmArmSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionActionRequestSchema)) body: SessionActionRequest
  ) {
    return mapSessionMutationResponse(
      await this.sessionOrchestrator.confirmArmSession(id, body.actor)
    );
  }

  @Post(":id/start")
  async startSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionActionRequestSchema)) body: SessionActionRequest
  ) {
    return mapSessionMutationResponse(
      await this.sessionOrchestrator.startSession(id, body.actor)
    );
  }

  @Post(":id/pause")
  async pauseSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionActionRequestSchema)) body: SessionActionRequest
  ) {
    return mapSessionMutationResponse(
      await this.sessionOrchestrator.pauseSession(id, body.actor)
    );
  }

  @Post(":id/resume")
  async resumeSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resumeSessionRequestSchema)) body: ResumeSessionRequest
  ) {
    return mapSessionMutationResponse(
      await this.sessionOrchestrator.resumeSession(id, body.reason, body.actor)
    );
  }

  @Post(":id/submit-artifact")
  async submitArtifact(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submitArtifactRequestSchema)) body: SubmitArtifactRequest
  ) {
    return mapSubmitArtifactResponse(await this.sessionOrchestrator.submitArtifact(id, body));
  }

  @Post(":id/request-review")
  async requestReview(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(requestReviewRequestSchema)) body: RequestReviewRequest
  ) {
    return mapReviewResultResponse(await this.sessionOrchestrator.requestReview(id, body));
  }

  @Post(":id/penalize")
  async penalize(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionActionRequestSchema)) body: SessionActionRequest
  ) {
    return mapSessionMutationResponse(
      await this.sessionOrchestrator.penalizeSession(id, body.actor)
    );
  }

  @Post(":id/excuse")
  async excuse(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionActionRequestSchema)) body: SessionActionRequest
  ) {
    return mapSessionMutationResponse(
      await this.sessionOrchestrator.excuseSession(id, body.actor)
    );
  }

  @Get(":id/scoring")
  async getScoring(@Param("id") id: string) {
    return mapGetScoringResponse(await this.sessionOrchestrator.getSessionScoring(id));
  }

  @Get(":id/events")
  async getEvents(@Param("id") id: string) {
    return mapGetEventsResponse(await this.sessionOrchestrator.getSessionEvents(id));
  }
}
