import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { TelemetryController } from "./telemetry.controller";
import { TelemetryAnalysisScheduler } from "./telemetry-analysis.scheduler";
import { TelemetryAnalysisWorker } from "./telemetry-analysis.worker";
import { TelemetryProcessor } from "./telemetry.processor";
import { TelemetryRepository } from "./telemetry.repository";

@Module({
  imports: [SessionModule],
  controllers: [TelemetryController],
  providers: [
    TelemetryRepository,
    TelemetryAnalysisWorker,
    TelemetryAnalysisScheduler,
    TelemetryProcessor
  ],
  exports: [
    TelemetryProcessor,
    TelemetryRepository,
    TelemetryAnalysisScheduler,
    TelemetryAnalysisWorker
  ]
})
export class TelemetryModule {}
