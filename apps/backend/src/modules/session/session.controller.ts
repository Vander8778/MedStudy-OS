import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { Artifact } from "@medstudy/domain";
import { SessionOrchestrator, type CreateSessionCommand, type SessionActionActor } from "./session.orchestrator";

type PauseResumeBody = {
  actor?: SessionActionActor;
  reason?: "warning_resolved" | "pause_within_limit" | "manual_clear" | "admin_clear";
};

@Controller("sessions")
export class SessionController {
  constructor(private readonly sessionOrchestrator: SessionOrchestrator) {}

  @Post()
  createSession(@Body() body: CreateSessionCommand) {
    return this.sessionOrchestrator.createSession(body);
  }

  @Get(":id")
  getSession(@Param("id") id: string) {
    return this.sessionOrchestrator.getSession(id);
  }

  @Post(":id/arm")
  armSession(@Param("id") id: string, @Body() body: { actor?: SessionActionActor }) {
    return this.sessionOrchestrator.armSession(id, body.actor);
  }

  @Post(":id/confirm-arm")
  confirmArmSession(@Param("id") id: string, @Body() body: { actor?: SessionActionActor }) {
    return this.sessionOrchestrator.confirmArmSession(id, body.actor);
  }

  @Post(":id/start")
  startSession(@Param("id") id: string, @Body() body: { actor?: SessionActionActor }) {
    return this.sessionOrchestrator.startSession(id, body.actor);
  }

  @Post(":id/pause")
  pauseSession(@Param("id") id: string, @Body() body: PauseResumeBody) {
    return this.sessionOrchestrator.pauseSession(id, body.actor);
  }

  @Post(":id/resume")
  resumeSession(@Param("id") id: string, @Body() body: PauseResumeBody) {
    return this.sessionOrchestrator.resumeSession(
      id,
      body.reason ?? "pause_within_limit",
      body.actor
    );
  }

  @Post(":id/submit-artifact")
  submitArtifact(
    @Param("id") id: string,
    @Body()
    body: {
      type: Artifact["type"];
      title: string;
      source: Artifact["source"];
      status: Artifact["status"];
      createdByUserId?: string;
      description?: string;
      uri?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.sessionOrchestrator.submitArtifact(id, body);
  }

  @Post(":id/request-review")
  requestReview(@Param("id") id: string, @Body() body: { actor?: SessionActionActor }) {
    return this.sessionOrchestrator.requestReview(id, body);
  }

  @Post(":id/penalize")
  penalize(@Param("id") id: string, @Body() body: { actor?: SessionActionActor }) {
    return this.sessionOrchestrator.penalizeSession(id, body.actor);
  }

  @Post(":id/excuse")
  excuse(@Param("id") id: string, @Body() body: { actor?: SessionActionActor }) {
    return this.sessionOrchestrator.excuseSession(id, body.actor);
  }

  @Get(":id/scoring")
  getScoring(@Param("id") id: string) {
    return this.sessionOrchestrator.getSessionScoring(id);
  }

  @Get(":id/events")
  getEvents(@Param("id") id: string) {
    return this.sessionOrchestrator.getSessionEvents(id);
  }
}
