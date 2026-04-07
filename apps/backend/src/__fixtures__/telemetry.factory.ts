import type {
  BatchIngestEnvelopeInput,
  IngestTelemetryRequest
} from "@medstudy/contracts";
import type { TelemetryEventRecord } from "../modules/telemetry/telemetry.repository";

export function buildTelemetryEvent(
  overrides: Partial<IngestTelemetryRequest> = {}
): IngestTelemetryRequest {
  return {
    userId: "user_fixture",
    sessionId: "session_fixture",
    clientEventId: "client_event_1",
    source: "desktop",
    type: "heartbeat",
    occurredAt: "2026-04-07T09:10:00.000Z",
    receivedAt: "2026-04-07T09:10:01.000Z",
    payload: {},
    ...overrides
  };
}

export function buildTelemetryBatch(
  overrides: {
    events?: readonly Partial<IngestTelemetryRequest>[];
  } = {}
): BatchIngestEnvelopeInput {
  return {
    events:
      overrides.events?.map((event, index) =>
        buildTelemetryEvent({
          clientEventId: `client_event_${index + 1}`,
          ...event
        })
      ) ?? [buildTelemetryEvent()]
  };
}

export function buildTelemetryRecord(
  overrides: Partial<TelemetryEventRecord> = {}
): TelemetryEventRecord {
  return {
    id: "telemetry_1",
    userId: "user_fixture",
    sessionId: "session_fixture",
    clientEventId: "client_event_1",
    source: "desktop",
    type: "heartbeat",
    occurredAt: "2026-04-07T09:10:00.000Z",
    receivedAt: "2026-04-07T09:10:01.000Z",
    serverReceivedAt: "2026-04-07T09:10:01.000Z",
    payload: {},
    createdAt: "2026-04-07T09:10:01.000Z",
    ...overrides
  };
}
