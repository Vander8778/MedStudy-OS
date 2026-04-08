import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit
} from "@nestjs/common";
import { SessionRepository } from "../session/session.repository";
import { TelemetryAnalysisWorker } from "./telemetry-analysis.worker";

const DEFAULT_ANALYSIS_INTERVAL_MS = 60_000;

@Injectable()
export class TelemetryAnalysisScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly analysisIntervalMs = DEFAULT_ANALYSIS_INTERVAL_MS;
  private readonly registeredSessions = new Map<string, number>();
  private readonly inFlightSessions = new Set<string>();
  private intervalHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly telemetryAnalysisWorker: TelemetryAnalysisWorker,
    private readonly sessionRepository: SessionRepository
  ) {}

  async onModuleInit() {
    await this.reloadActiveSessions();
    this.intervalHandle = setInterval(() => {
      void this.tick();
    }, this.analysisIntervalMs);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }

  isRegistered(sessionId: string) {
    return this.registeredSessions.has(sessionId);
  }

  getRegisteredSessionCount() {
    return this.registeredSessions.size;
  }

  registerSession(sessionId: string, dueAt = Date.now()) {
    this.registeredSessions.set(sessionId, dueAt);
  }

  deregisterSession(sessionId: string) {
    this.registeredSessions.delete(sessionId);
    this.inFlightSessions.delete(sessionId);
  }

  async reloadActiveSessions() {
    const sessions = await this.sessionRepository.listSessionIdsByStates([
      "active_valid",
      "active_warning"
    ]);

    sessions.forEach((sessionId) => this.registerSession(sessionId));
  }

  async tick(now = Date.now()) {
    const dueSessionIds = [...this.registeredSessions.entries()]
      .filter(([, dueAt]) => dueAt <= now)
      .map(([sessionId]) => sessionId);

    // MVP note: due sessions are processed sequentially to keep the scheduler simple and to
    // make per-session flow easier to reason about. This should be parallelized later once
    // the runtime needs higher throughput; inFlightSessions already provides the safety hook.
    for (const sessionId of dueSessionIds) {
      await this.processDueSession(sessionId, now);
    }
  }

  private async processDueSession(sessionId: string, now: number) {
    if (this.inFlightSessions.has(sessionId)) {
      return;
    }

    this.inFlightSessions.add(sessionId);

    try {
      const result = await this.telemetryAnalysisWorker.processSessionAnalysis(
        sessionId
      );

      if (result.deregister) {
        this.deregisterSession(sessionId);
        return;
      }

      this.registerSession(sessionId, now + this.analysisIntervalMs);
    } finally {
      this.inFlightSessions.delete(sessionId);
    }
  }
}
