import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckpointPrompt } from "./CheckpointPrompt";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { TelemetryStatusBadge } from "./TelemetryStatusBadge";

describe("desktop UI components", () => {
  it("renders the connection banner state clearly", () => {
    const markup = renderToStaticMarkup(
      <ConnectionIndicator state="offline" message="Polling failed repeatedly" />
    );

    expect(markup).toContain("OFFLINE");
    expect(markup).toContain("Polling failed repeatedly");
  });

  it("renders telemetry queue health", () => {
    const markup = renderToStaticMarkup(
      <TelemetryStatusBadge
        status={{
          capturing: true,
          queuedEvents: 12,
          retainedUploadedEvents: 4,
          discardedEvents: 2,
          consecutiveFailureCount: 0,
          nextRetryInMs: 10_000,
          queueWarning: false
        }}
        bufferHealth={{
          maxEvents: 10_000,
          pendingEvents: 12,
          retainedUploadedEvents: 4,
          totalEvents: 16,
          prunedUploadedEvents: 0,
          prunedPendingEvents: 0,
          queueWarning: false
        }}
      />
    );

    expect(markup).toContain("12 queued");
    expect(markup).toContain("Retained uploaded: 4");
    expect(markup).toContain("Discarded events: 2");
  });

  it("renders checkpoint prompts only when backend marks one as due", () => {
    const markup = renderToStaticMarkup(
      <CheckpointPrompt
        checkpoint={{
          id: "checkpoint_1",
          sessionId: "session_1",
          order: 0,
          title: "Checkpoint Due",
          status: "due",
          dueAt: "2026-04-02T10:20:00.000Z",
          createdAt: "2026-04-02T10:00:00.000Z",
          updatedAt: "2026-04-02T10:00:00.000Z"
        }}
      />
    );

    expect(markup).toContain("Checkpoint Due");
    expect(markup).toContain("Due at");
  });
});
