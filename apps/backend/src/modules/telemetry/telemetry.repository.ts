import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { createId, serializeJson, toDate } from "../../common/backend-utils";

export type CreateTelemetryEventCommand = {
  userId: string;
  sessionId?: string;
  source: "desktop" | "mobile" | "web_admin" | "backend" | "system";
  type:
    | "heartbeat"
    | "focus_changed"
    | "input_activity"
    | "idle_detected"
    | "window_changed"
    | "url_changed"
    | "process_snapshot"
    | "manual_note";
  occurredAt: string;
  receivedAt: string;
  payload: Record<string, unknown>;
};

@Injectable()
export class TelemetryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(command: CreateTelemetryEventCommand) {
    return this.prisma.telemetryEvent.create({
      data: {
        id: createId("telemetry"),
        userId: command.userId,
        sessionId: command.sessionId,
        source: command.source,
        type: command.type,
        occurredAt: toDate(command.occurredAt),
        receivedAt: toDate(command.receivedAt),
        payloadJson: serializeJson(command.payload),
        createdAt: new Date()
      }
    });
  }
}
