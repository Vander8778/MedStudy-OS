import { Body, Controller, Post } from "@nestjs/common";
import { TelemetryProcessor } from "./telemetry.processor";
import type { CreateTelemetryEventCommand } from "./telemetry.repository";

@Controller("telemetry")
export class TelemetryController {
  constructor(private readonly telemetryProcessor: TelemetryProcessor) {}

  @Post("events")
  ingestTelemetry(@Body() body: CreateTelemetryEventCommand) {
    return this.telemetryProcessor.ingestEvent(body);
  }
}
