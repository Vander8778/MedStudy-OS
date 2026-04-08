import { Inject, Injectable, Optional } from "@nestjs/common";
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";
import { getAppliedMigrationCount } from "../config/migration-status";
import { PrismaService } from "../prisma/prisma.service";
import { getEnv } from "../config/env";
import { TelemetryAnalysisScheduler } from "../modules/telemetry/telemetry-analysis.scheduler";

type MetricsBundle = {
  registry: Registry;
  httpRequestsTotal: Counter<"method" | "route" | "status">;
  httpRequestDurationSeconds: Histogram<"method" | "route">;
  sessionFinalizationsTotal: Counter<"outcome">;
  sessionFinalizationErrorsTotal: Counter<"error_type">;
  sessionsStuckReviewPending: Gauge;
  telemetryQueueDepth: Gauge;
  telemetryEventsProcessedTotal: Counter<"status">;
  aiRequestsTotal: Counter<"prompt_key" | "status">;
  aiRequestDurationSeconds: Histogram<"prompt_key">;
  dbPoolActiveConnections: Gauge;
  migrationVersion: Gauge;
};

declare global {
  var __medstudyMetricsBundle: MetricsBundle | undefined;
}

function createMetricsBundle(): MetricsBundle {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "medstudy_" });

  return {
    registry,
    httpRequestsTotal: new Counter({
      name: "http_requests_total",
      help: "Total HTTP requests.",
      labelNames: ["method", "route", "status"],
      registers: [registry]
    }),
    httpRequestDurationSeconds: new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds.",
      labelNames: ["method", "route"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [registry]
    }),
    sessionFinalizationsTotal: new Counter({
      name: "session_finalizations_total",
      help: "Session terminal outcomes recorded by the backend.",
      labelNames: ["outcome"],
      registers: [registry]
    }),
    sessionFinalizationErrorsTotal: new Counter({
      name: "session_finalization_errors_total",
      help: "Session finalization errors.",
      labelNames: ["error_type"],
      registers: [registry]
    }),
    sessionsStuckReviewPending: new Gauge({
      name: "sessions_stuck_review_pending",
      help: "Sessions stuck in review_pending beyond the operational threshold.",
      registers: [registry]
    }),
    telemetryQueueDepth: new Gauge({
      name: "telemetry_queue_depth",
      help: "Current telemetry scheduler queue depth.",
      registers: [registry]
    }),
    telemetryEventsProcessedTotal: new Counter({
      name: "telemetry_events_processed_total",
      help: "Telemetry worker processing outcomes.",
      labelNames: ["status"],
      registers: [registry]
    }),
    aiRequestsTotal: new Counter({
      name: "ai_requests_total",
      help: "AI request outcomes.",
      labelNames: ["prompt_key", "status"],
      registers: [registry]
    }),
    aiRequestDurationSeconds: new Histogram({
      name: "ai_request_duration_seconds",
      help: "AI request total duration in seconds.",
      labelNames: ["prompt_key"],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20],
      registers: [registry]
    }),
    dbPoolActiveConnections: new Gauge({
      name: "db_pool_active_connections",
      help: "Backend database connectivity gauge.",
      registers: [registry]
    }),
    migrationVersion: new Gauge({
      name: "migration_version",
      help: "Current applied migration count.",
      registers: [registry]
    })
  };
}

const metrics = globalThis.__medstudyMetricsBundle ?? createMetricsBundle();
globalThis.__medstudyMetricsBundle = metrics;

function sanitizeRoute(route: string) {
  return route.trim().length > 0 ? route : "unknown";
}

export function recordHttpRequestMetric(input: {
  method: string;
  route: string;
  status: number;
  durationSeconds: number;
}) {
  const route = sanitizeRoute(input.route);
  metrics.httpRequestsTotal.inc({
    method: input.method,
    route,
    status: String(input.status)
  });
  metrics.httpRequestDurationSeconds.observe(
    { method: input.method, route },
    input.durationSeconds
  );
}

export function recordSessionFinalizationMetric(
  outcome: "completed" | "partial" | "failed" | "penalized"
) {
  metrics.sessionFinalizationsTotal.inc({ outcome });
}

export function recordSessionFinalizationErrorMetric(errorType: string) {
  metrics.sessionFinalizationErrorsTotal.inc({ error_type: errorType });
}

export function recordTelemetryProcessedMetric(status: "success" | "error" | "skipped") {
  metrics.telemetryEventsProcessedTotal.inc({ status });
}

export function recordAiRequestMetric(input: {
  promptKey: string;
  status: "success" | "error";
  durationSeconds: number;
}) {
  metrics.aiRequestsTotal.inc({
    prompt_key: input.promptKey,
    status: input.status
  });
  metrics.aiRequestDurationSeconds.observe(
    { prompt_key: input.promptKey },
    input.durationSeconds
  );
}

@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(TelemetryAnalysisScheduler)
    private readonly telemetryScheduler?: TelemetryAnalysisScheduler
  ) {}

  async getAppliedMigrationVersion() {
    return getAppliedMigrationCount(this.prisma);
  }

  async refreshOperationalGauges() {
    try {
      await this.prisma.$queryRawUnsafe("SELECT 1");
      metrics.dbPoolActiveConnections.set(1);
    } catch {
      metrics.dbPoolActiveConnections.set(0);
    }

    const env = getEnv();
    const cutoff = new Date(Date.now() - env.reviewPendingStuckMinutes * 60_000);
    // Known coupling point: this metric reads the current Prisma session model directly
    // because M15 does not introduce a separate operational repository abstraction.
    const stuckSessions = await this.prisma.session.count({
      where: {
        state: "review_pending",
        reviewRequestedAt: {
          lt: cutoff
        }
      }
    });

    metrics.sessionsStuckReviewPending.set(stuckSessions);
    metrics.telemetryQueueDepth.set(this.telemetryScheduler?.getRegisteredSessionCount() ?? 0);
    metrics.migrationVersion.set(await this.getAppliedMigrationVersion());
  }

  async renderMetrics() {
    await this.refreshOperationalGauges();
    return metrics.registry.metrics();
  }

  getContentType() {
    return metrics.registry.contentType;
  }
}
