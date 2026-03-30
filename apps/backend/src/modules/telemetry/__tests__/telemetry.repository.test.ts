import { describe, expect, it, vi } from "vitest";
import { TelemetryRepository } from "../telemetry.repository";

function createTelemetryRow(
  id: string,
  serverReceivedAt: string
) {
  return {
    id,
    userId: "user_1",
    sessionId: "session_1",
    clientEventId: null,
    source: "desktop",
    type: "heartbeat",
    occurredAt: new Date(serverReceivedAt),
    receivedAt: new Date(serverReceivedAt),
    serverReceivedAt: new Date(serverReceivedAt),
    payloadJson: "{}",
    createdAt: new Date(serverReceivedAt)
  };
}

describe("TelemetryRepository", () => {
  it("filters by checkpoint analysis time in Prisma and still slices after the last processed raw event", async () => {
    const prisma = {
      telemetryEvent: {
        findMany: vi.fn(async () => [
          createTelemetryRow("telemetry_1", "2026-03-30T09:10:00.000Z"),
          createTelemetryRow("telemetry_2", "2026-03-30T09:10:00.000Z"),
          createTelemetryRow("telemetry_3", "2026-03-30T09:11:00.000Z")
        ])
      }
    };
    const repository = new TelemetryRepository(prisma as never);

    const result = await repository.findEventsSinceCheckpoint(
      "session_1",
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        lastProcessedRawEventId: "telemetry_2",
        lastAnalyzedAt: "2026-03-30T09:10:00.000Z",
        createdAt: "2026-03-30T09:00:00.000Z",
        updatedAt: "2026-03-30T09:00:00.000Z"
      }
    );

    expect(prisma.telemetryEvent.findMany).toHaveBeenCalledWith({
      where: {
        sessionId: "session_1",
        serverReceivedAt: {
          gte: new Date("2026-03-30T09:10:00.000Z")
        }
      },
      orderBy: [
        { serverReceivedAt: "asc" },
        { createdAt: "asc" }
      ]
    });
    expect(result.map((event) => event.id)).toEqual(["telemetry_3"]);
  });

  it("falls back to loading the full session window when no checkpoint clock exists yet", async () => {
    const prisma = {
      telemetryEvent: {
        findMany: vi.fn(async () => [
          createTelemetryRow("telemetry_1", "2026-03-30T09:10:00.000Z")
        ])
      }
    };
    const repository = new TelemetryRepository(prisma as never);

    const result = await repository.findEventsSinceCheckpoint(
      "session_1",
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        createdAt: "2026-03-30T09:00:00.000Z",
        updatedAt: "2026-03-30T09:00:00.000Z"
      }
    );

    expect(prisma.telemetryEvent.findMany).toHaveBeenCalledWith({
      where: { sessionId: "session_1" },
      orderBy: [
        { serverReceivedAt: "asc" },
        { createdAt: "asc" }
      ]
    });
    expect(result.map((event) => event.id)).toEqual(["telemetry_1"]);
  });

  it("returns all fetched events when the checkpoint raw-event id is missing from the filtered window", async () => {
    const prisma = {
      telemetryEvent: {
        findMany: vi.fn(async () => [
          createTelemetryRow("telemetry_2", "2026-03-30T09:10:00.000Z"),
          createTelemetryRow("telemetry_3", "2026-03-30T09:11:00.000Z")
        ])
      }
    };
    const repository = new TelemetryRepository(prisma as never);

    const result = await repository.findEventsSinceCheckpoint(
      "session_1",
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        lastProcessedRawEventId: "telemetry_missing",
        lastAnalyzedAt: "2026-03-30T09:10:00.000Z",
        createdAt: "2026-03-30T09:00:00.000Z",
        updatedAt: "2026-03-30T09:00:00.000Z"
      }
    );

    expect(result.map((event) => event.id)).toEqual([
      "telemetry_2",
      "telemetry_3"
    ]);
  });
});
