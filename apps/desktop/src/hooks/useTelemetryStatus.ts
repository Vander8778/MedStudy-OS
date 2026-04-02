import { useEffect } from "react";
import {
  getBufferHealth,
  getTelemetryStatus
} from "../services/telemetry-bridge";
import { useTelemetryStore } from "../state/telemetry-store";

export function useTelemetryStatus(pollIntervalMs = 5_000) {
  const telemetryStore = useTelemetryStore();

  useEffect(() => {
    let cancelled = false;

    async function pollTelemetry() {
      const [status, bufferHealth] = await Promise.all([
        getTelemetryStatus(),
        getBufferHealth()
      ]);
      if (cancelled) {
        return;
      }
      telemetryStore.setStatus(status);
      telemetryStore.setBufferHealth(bufferHealth);
    }

    void pollTelemetry();
    const interval = window.setInterval(() => {
      void pollTelemetry();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pollIntervalMs, telemetryStore]);

  return telemetryStore;
}
