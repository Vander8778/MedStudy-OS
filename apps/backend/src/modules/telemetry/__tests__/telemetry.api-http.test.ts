import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiErrorFilter } from "../../../common/api-error.filter";
import { TelemetryController } from "../telemetry.controller";
import { TelemetryProcessor } from "../telemetry.processor";

describe("TelemetryController HTTP", () => {
  let app: INestApplication;
  const telemetryProcessor = {
    ingestEvent: vi.fn(),
    ingestBatch: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryProcessor,
          useValue: telemetryProcessor
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiErrorFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 422 validation.invalid_input when receivedAt is earlier than occurredAt", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/telemetry/events")
      .send({
        userId: "user_1",
        sessionId: "session_1",
        source: "desktop",
        type: "heartbeat",
        occurredAt: "2026-03-29T09:10:00.000Z",
        receivedAt: "2026-03-29T09:09:59.000Z",
        payload: {}
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: "receivedAt",
        message: "receivedAt must be on or after occurredAt"
      })
    ]);
    expect(telemetryProcessor.ingestEvent).not.toHaveBeenCalled();
  });

  it("returns a persist-only single-event response without antiAvoidance", async () => {
    telemetryProcessor.ingestEvent.mockResolvedValue({
      telemetryEvent: { id: "telemetry_1" },
      accepted: true
    });

    const response = await request(app.getHttpServer())
      .post("/api/telemetry/events")
      .send({
        userId: "user_1",
        sessionId: "session_1",
        clientEventId: "client_1",
        source: "desktop",
        type: "heartbeat",
        occurredAt: "2026-03-29T09:10:00.000Z",
        receivedAt: "2026-03-29T09:10:05.000Z",
        payload: {}
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      telemetryEventId: "telemetry_1",
      accepted: true
    });
    expect(response.body.antiAvoidance).toBeUndefined();
  });

  it("returns partial-success batch ingestion results", async () => {
    telemetryProcessor.ingestBatch.mockResolvedValue({
      results: [
        {
          clientEventId: "client_1",
          telemetryEventId: "telemetry_1",
          accepted: true
        },
        {
          clientEventId: "client_2",
          accepted: false,
          error: "Duplicate telemetry clientEventId for this session."
        }
      ],
      acceptedCount: 1,
      rejectedCount: 1
    });

    const response = await request(app.getHttpServer())
      .post("/api/telemetry/events/batch")
      .send({
        events: [
          {
            userId: "user_1",
            sessionId: "session_1",
            clientEventId: "client_1",
            source: "desktop",
            type: "heartbeat",
            occurredAt: "2026-03-29T09:10:00.000Z",
            receivedAt: "2026-03-29T09:10:05.000Z",
            payload: {}
          },
          {
            bad: "event"
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      results: [
        {
          clientEventId: "client_1",
          telemetryEventId: "telemetry_1",
          accepted: true
        },
        {
          clientEventId: "client_2",
          accepted: false,
          error: "Duplicate telemetry clientEventId for this session."
        }
      ],
      acceptedCount: 1,
      rejectedCount: 1
    });
  });
});
