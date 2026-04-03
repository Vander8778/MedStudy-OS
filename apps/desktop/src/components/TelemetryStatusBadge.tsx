import type { BufferHealth, TelemetryStatus } from "../types";

export function TelemetryStatusBadge({
  status,
  bufferHealth
}: {
  status: TelemetryStatus;
  bufferHealth: BufferHealth;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "0.2rem",
        padding: "0.75rem 1rem",
        borderRadius: "1rem",
        background: status.queueWarning ? "#fff3cd" : "#edf7ed",
        color: status.queueWarning ? "#663c00" : "#1d7f47"
      }}
    >
      <strong>
        Telemetry {status.capturing ? "capturing" : "idle"} • {status.queuedEvents} queued
      </strong>
      <span style={{ fontSize: "0.85rem" }}>
        Retained uploaded: {bufferHealth.retainedUploadedEvents} • Next flush in{" "}
        {status.nextRetryInMs}ms
      </span>
      {status.discardedEvents > 0 ? (
        <span style={{ fontSize: "0.85rem" }}>
          Discarded events: {status.discardedEvents}
        </span>
      ) : null}
    </div>
  );
}
