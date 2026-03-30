import { Body, Controller, Inject, Post } from "@nestjs/common";
import type {
  BatchIngestEnvelopeInput,
  IngestTelemetryRequest
} from "@medstudy/contracts";
import {
  mapTelemetryBatchIngestResponse,
  mapTelemetryIngestResponse
} from "../../common/view-mappers";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  batchIngestEnvelopeSchema,
  ingestTelemetryRequestSchema
} from "./dto/ingest-telemetry.dto";
import { TelemetryProcessor } from "./telemetry.processor";

@Controller("telemetry")
export class TelemetryController {
  constructor(
    @Inject(TelemetryProcessor)
    private readonly telemetryProcessor: TelemetryProcessor
  ) {}

  @Post("events")
  async ingestTelemetry(
    @Body(new ZodValidationPipe(ingestTelemetryRequestSchema)) body: IngestTelemetryRequest
  ) {
    return mapTelemetryIngestResponse(await this.telemetryProcessor.ingestEvent(body));
  }

  @Post("events/batch")
  async ingestTelemetryBatch(
    @Body(new ZodValidationPipe(batchIngestEnvelopeSchema)) body: BatchIngestEnvelopeInput
  ) {
    return mapTelemetryBatchIngestResponse(
      await this.telemetryProcessor.ingestBatch(body)
    );
  }
}
