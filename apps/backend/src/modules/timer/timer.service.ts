import { Injectable } from "@nestjs/common";
import type { Checkpoint } from "@medstudy/domain";
import { PrismaService } from "../../prisma/prisma.service";

type TimerCallback = (sessionId: string) => Promise<void>;

@Injectable()
export class TimerService {
  private readonly scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly prisma: PrismaService) {}

  private getTimerKey(sessionId: string, name: string) {
    return `${sessionId}:${name}`;
  }

  private clearTimer(sessionId: string, name: string) {
    const key = this.getTimerKey(sessionId, name);
    const existing = this.scheduledTimers.get(key);

    if (existing) {
      clearTimeout(existing);
      this.scheduledTimers.delete(key);
    }
  }

  clearAllForSession(sessionId: string) {
    const prefix = `${sessionId}:`;

    for (const [key, handle] of this.scheduledTimers.entries()) {
      if (key.startsWith(prefix)) {
        clearTimeout(handle);
        this.scheduledTimers.delete(key);
      }
    }
  }

  async runWithFreshSession(sessionId: string, callback: TimerCallback) {
    await this.prisma.session.findUniqueOrThrow({
      where: { id: sessionId }
    });

    await callback(sessionId);
  }

  private schedule(sessionId: string, name: string, delayMs: number, callback: TimerCallback) {
    this.clearTimer(sessionId, name);

    const handle = setTimeout(() => {
      void this.runWithFreshSession(sessionId, callback);
    }, Math.max(delayMs, 0));

    this.scheduledTimers.set(this.getTimerKey(sessionId, name), handle);
  }

  scheduleCheckpointDueChecks(
    sessionId: string,
    checkpoints: readonly Checkpoint[],
    callback: TimerCallback
  ) {
    checkpoints.forEach((checkpoint, index) => {
      const delayMs = Math.max(Date.parse(checkpoint.dueAt) - Date.now(), 0);
      this.schedule(sessionId, `checkpoint:${index}`, delayMs, callback);
    });
  }

  scheduleWarningGraceExpiry(sessionId: string, delayMinutes: number, callback: TimerCallback) {
    this.schedule(sessionId, "warning_grace", delayMinutes * 60000, callback);
  }

  cancelWarningGraceExpiry(sessionId: string) {
    this.clearTimer(sessionId, "warning_grace");
  }

  schedulePauseLimitExpiry(sessionId: string, delayMinutes: number, callback: TimerCallback) {
    this.schedule(sessionId, "pause_limit", delayMinutes * 60000, callback);
  }

  cancelPauseLimitExpiry(sessionId: string) {
    this.clearTimer(sessionId, "pause_limit");
  }

  scheduleSessionReview(sessionId: string, endsAt: string, callback: TimerCallback) {
    this.schedule(sessionId, "session_review", Math.max(Date.parse(endsAt) - Date.now(), 0), callback);
  }

  schedulePeriodicAvoidanceCheck(sessionId: string, everyMinutes: number, callback: TimerCallback) {
    this.schedule(sessionId, "avoidance_check", everyMinutes * 60000, callback);
  }
}
