import { describe, expect, it } from "vitest";
import {
  getTelemetryCaptureMode,
  isActiveTelemetryState
} from "./types";

describe("desktop telemetry state mapping", () => {
  it("uses full capture for active states", () => {
    expect(getTelemetryCaptureMode("active_valid")).toBe("full");
    expect(getTelemetryCaptureMode("active_warning")).toBe("full");
    expect(isActiveTelemetryState("active_valid")).toBe(true);
  });

  it("uses heartbeat-only capture for paused states", () => {
    expect(getTelemetryCaptureMode("paused_valid")).toBe("heartbeat_only");
    expect(getTelemetryCaptureMode("paused_expired")).toBe("heartbeat_only");
    expect(isActiveTelemetryState("paused_valid")).toBe(true);
  });

  it("disables telemetry capture for non-runtime states", () => {
    expect(getTelemetryCaptureMode("planned")).toBeNull();
    expect(getTelemetryCaptureMode("review_pending")).toBeNull();
    expect(getTelemetryCaptureMode("completed")).toBeNull();
  });
});
