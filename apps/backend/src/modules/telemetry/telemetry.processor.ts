import {
  ingestTelemetryRequestSchema,
  type BatchIngestEnvelopeInput,
  type BatchIngestResponse,
  type IngestTelemetryRequest
} from "@medstudy/contracts";
import { Injectable } from "@nestjs/common";
import { TelemetryAnalysisScheduler } from "./telemetry-analysis.scheduler";
import {
  type CreateTelemetryEventCommand,
  TelemetryRepository
} from "./telemetry.repository";

@Injectable()
export class TelemetryProcessor {
  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly telemetryAnalysisScheduler: TelemetryAnalysisScheduler
  ) {}

  private toCreateCommand(
    input: IngestTelemetryRequest
  ): CreateTelemetryEventCommand {
    return {
      ...input,
      serverReceivedAt: new Date().toISOString()
    };
  }

  async ingestEvent(input: IngestTelemetryRequest) {
    const result = await this.telemetryRepository.createEvent(
      this.toCreateCommand(input)
    );

    if (input.sessionId) {
      this.telemetryAnalysisScheduler.registerSession(input.sessionId);
    }

    return {
      telemetryEvent: {
        id: result.event.id
      },
      accepted: true as const
    };
  }

  async ingestBatch(input: BatchIngestEnvelopeInput): Promise<BatchIngestResponse> {
    // MVP note: batch ingestion is intentionally persistence-safe rather than bulk-optimized.
    // We validate and insert serially so partial-success semantics and duplicate reporting stay
    // explicit per item, but large reconnect batches will still incur one-or-more DB round-trips
    // per event until a later bulk ingestion path is introduced.
    const results: BatchIngestResponse["results"] = [];

    for (const rawEvent of input.events) {
      const parsed = ingestTelemetryRequestSchema.safeParse(rawEvent);

      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];

        results.push({
          accepted: false,
          error: firstIssue?.message ?? "Invalid telemetry event payload."
        });
        continue;
      }

      const createResult = await this.telemetryRepository.createEvent(
        this.toCreateCommand(parsed.data)
      );

      if (createResult.duplicate) {
        results.push({
          clientEventId: parsed.data.clientEventId,
          accepted: false,
          error: "Duplicate telemetry clientEventId for this session."
        });
        continue;
      }

      if (parsed.data.sessionId) {
        this.telemetryAnalysisScheduler.registerSession(parsed.data.sessionId);
      }

      results.push({
        clientEventId: parsed.data.clientEventId,
        telemetryEventId: createResult.event.id,
        accepted: true
      });
    }

    const acceptedCount = results.filter((result) => result.accepted).length;

    return {
      results,
      acceptedCount,
      rejectedCount: results.length - acceptedCount
    };
  }
}
