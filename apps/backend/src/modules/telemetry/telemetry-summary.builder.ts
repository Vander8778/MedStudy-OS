import { createId } from "../../common/backend-utils";
import type {
  TelemetryEventRecord,
  TelemetrySummaryRecord
} from "./telemetry.repository";

export type TelemetrySummarySessionSnapshot = {
  id: string;
  state: string;
  startedAt?: string;
  createdAt: string;
  validMinutes: number;
  invalidMinutes: number;
  warningCount: number;
  missedCheckpointCount: number;
  currentWarningDurationMinutes: number;
};

export type BuildTelemetrySummaryInput = {
  session: TelemetrySummarySessionSnapshot;
  rawEvents: readonly TelemetryEventRecord[];
  now: string;
  windowStartsAt?: string;
};

const CONTEXT_SWITCH_EVENT_TYPES = new Set<
  TelemetryEventRecord["type"]
>(["focus_changed", "window_changed", "url_changed"]);

function toOrderedEvents(rawEvents: readonly TelemetryEventRecord[]) {
  return [...rawEvents].sort((left, right) => {
    const serverDelta =
      Date.parse(left.serverReceivedAt) - Date.parse(right.serverReceivedAt);

    if (serverDelta !== 0) {
      return serverDelta;
    }

    return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  });
}

function getInputActivityPoint(event: TelemetryEventRecord) {
  if (event.type !== "input_activity") {
    return 0;
  }

  const activityCount =
    typeof event.payload.activityCount === "number"
      ? event.payload.activityCount
      : typeof event.payload.keystrokeCount === "number"
        ? event.payload.keystrokeCount
        : typeof event.payload.pointerEventCount === "number"
          ? event.payload.pointerEventCount
          : event.payload.hasMeaningfulInput === true
            ? 1
            : 0;

  return activityCount > 0 ? 1 : 0;
}

function getInputActivityLevel(rawEvents: readonly TelemetryEventRecord[]) {
  const activityPoints = rawEvents.reduce(
    (total, event) => total + getInputActivityPoint(event),
    0
  );

  if (activityPoints === 0) {
    return "none" as const;
  }

  if (activityPoints < 3) {
    return "minimal" as const;
  }

  return "normal" as const;
}

function getHeartbeatGapIdleMetrics(rawEvents: readonly TelemetryEventRecord[]) {
  let idleMinutes = 0;
  let longestIdleStretchMinutes = 0;
  let previousHeartbeatAt: string | undefined;

  for (const event of rawEvents) {
    if (event.type !== "heartbeat") {
      continue;
    }

    if (previousHeartbeatAt) {
      const gapMinutes =
        (Date.parse(event.serverReceivedAt) - Date.parse(previousHeartbeatAt)) / 60000;

      if (gapMinutes > 1) {
        idleMinutes += gapMinutes;
        longestIdleStretchMinutes = Math.max(longestIdleStretchMinutes, gapMinutes);
      }
    }

    previousHeartbeatAt = event.serverReceivedAt;
  }

  return {
    idleMinutes,
    longestIdleStretchMinutes
  };
}

function getIdleEventMetrics(rawEvents: readonly TelemetryEventRecord[]) {
  return rawEvents.reduce(
    (accumulator, event) => {
      if (event.type !== "idle_detected") {
        return accumulator;
      }

      const idleMinutes =
        typeof event.payload.idleMinutes === "number" ? event.payload.idleMinutes : 0;

      return {
        idleMinutes: accumulator.idleMinutes + Math.max(idleMinutes, 0),
        longestIdleStretchMinutes: Math.max(
          accumulator.longestIdleStretchMinutes,
          Math.max(idleMinutes, 0)
        )
      };
    },
    {
      idleMinutes: 0,
      longestIdleStretchMinutes: 0
    }
  );
}

function getNonStudyContextMinutes(rawEvents: readonly TelemetryEventRecord[]) {
  // MVP note: desktop/mobile emitters can either send an explicit non-study duration,
  // a generic duration for a non-study context event, or only a context flag that we
  // interpret by spanning to the next server-received event. This layered fallback keeps
  // the builder resilient across current payload variants, but the payload contract should
  // be formalized before expanding telemetry producers.
  return rawEvents.reduce((total, event, index) => {
    const explicitDuration =
      typeof event.payload.nonStudyContextMinutes === "number"
        ? event.payload.nonStudyContextMinutes
        : typeof event.payload.durationMinutes === "number"
          ? event.payload.durationMinutes
          : undefined;

    if (explicitDuration !== undefined) {
      return total + Math.max(explicitDuration, 0);
    }

    if (event.payload.isStudyContext !== false) {
      return total;
    }

    const nextEvent = rawEvents[index + 1];

    if (!nextEvent) {
      return total;
    }

    const spanMinutes =
      (Date.parse(nextEvent.serverReceivedAt) - Date.parse(event.serverReceivedAt)) / 60000;

    return total + Math.max(spanMinutes, 0);
  }, 0);
}

export function buildTelemetrySummary(
  input: BuildTelemetrySummaryInput
): TelemetrySummaryRecord {
  const orderedEvents = toOrderedEvents(input.rawEvents);
  const firstEvent = orderedEvents[0];
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const heartbeatGapMetrics = getHeartbeatGapIdleMetrics(orderedEvents);
  const idleEventMetrics = getIdleEventMetrics(orderedEvents);
  const idleMinutes = heartbeatGapMetrics.idleMinutes + idleEventMetrics.idleMinutes;
  const longestIdleStretchMinutes = Math.max(
    heartbeatGapMetrics.longestIdleStretchMinutes,
    idleEventMetrics.longestIdleStretchMinutes
  );
  const nonStudyContextMinutes = getNonStudyContextMinutes(orderedEvents);
  const windowStartsAt = input.windowStartsAt ?? firstEvent?.serverReceivedAt ?? input.now;
  const windowEndsAt = lastEvent?.serverReceivedAt ?? input.now;
  const sessionElapsedMinutes =
    input.session.startedAt === undefined
      ? 0
      : Math.max(
          (Date.parse(windowEndsAt) - Date.parse(input.session.startedAt)) / 60000,
          0
        );

  return {
    id: createId("telemetry_summary"),
    sessionId: input.session.id,
    windowStartsAt,
    windowEndsAt,
    rawEventCount: orderedEvents.length,
    lastRawEventId: lastEvent?.id ?? "",
    idleMinutes,
    longestIdleStretchMinutes,
    contextSwitchCount: orderedEvents.filter((event) =>
      CONTEXT_SWITCH_EVENT_TYPES.has(event.type)
    ).length,
    nonStudyContextMinutes,
    nonStudyContextDetected: nonStudyContextMinutes > 0,
    inputActivityLevel: getInputActivityLevel(orderedEvents),
    sessionElapsedMinutes,
    sessionValidMinutes: input.session.validMinutes,
    sessionInvalidMinutes: input.session.invalidMinutes,
    sessionWarningCount: input.session.warningCount,
    sessionMissedCheckpointCount: input.session.missedCheckpointCount,
    currentWarningActive: input.session.state === "active_warning",
    currentWarningDurationMinutes: input.session.currentWarningDurationMinutes,
    createdAt: input.now
  };
}
