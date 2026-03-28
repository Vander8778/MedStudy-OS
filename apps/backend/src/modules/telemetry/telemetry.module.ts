import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { TelemetryController } from "./telemetry.controller";
import { TelemetryProcessor } from "./telemetry.processor";
import { TelemetryRepository } from "./telemetry.repository";

@Module({
  imports: [SessionModule],
  controllers: [TelemetryController],
  providers: [TelemetryRepository, TelemetryProcessor],
  exports: [TelemetryProcessor, TelemetryRepository]
})
export class TelemetryModule {}
