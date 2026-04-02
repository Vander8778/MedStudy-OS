import { invoke } from "@tauri-apps/api/core";
import type {
  ActiveWindowInfo,
  BufferHealth,
  DesktopConfig,
  PersistedSessionContext,
  TelemetryCaptureMode,
  TelemetryStatus
} from "../types";

function hasTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const defaultConfig: DesktopConfig = {
  backendUrl: "http://127.0.0.1:3000/api",
  pollIntervalMs: 5_000,
  telemetryFlushIntervalMs: 10_000,
  telemetryBufferMaxEvents: 10_000,
  heartbeatIntervalMs: 30_000,
  windowTrackIntervalMs: 5_000,
  idleThresholdSeconds: 120,
  uploadedRetentionSeconds: 900,
  enableWindowTitleCapture: true,
  enableProcessNameCapture: true,
  enableInputActivityCapture: true
};

const defaultTelemetryStatus: TelemetryStatus = {
  capturing: false,
  queuedEvents: 0,
  retainedUploadedEvents: 0,
  consecutiveFailureCount: 0,
  nextRetryInMs: 0,
  queueWarning: false
};

const defaultBufferHealth: BufferHealth = {
  maxEvents: 10_000,
  pendingEvents: 0,
  retainedUploadedEvents: 0,
  totalEvents: 0,
  prunedUploadedEvents: 0,
  prunedPendingEvents: 0,
  queueWarning: false
};

export async function getDesktopConfig(): Promise<DesktopConfig> {
  if (!hasTauriRuntime()) {
    return defaultConfig;
  }

  return invoke<DesktopConfig>("get_desktop_config");
}

export async function getPersistedSessionContext() {
  if (!hasTauriRuntime()) {
    return null;
  }

  return invoke<PersistedSessionContext | null>("get_persisted_session_context");
}

export async function persistSessionContext(sessionId: string, userId: string) {
  if (!hasTauriRuntime()) {
    return;
  }

  await invoke("persist_session_context", { sessionId, userId });
}

export async function clearPersistedSessionContext() {
  if (!hasTauriRuntime()) {
    return;
  }

  await invoke("clear_persisted_session_context");
}

export async function startTelemetryCapture(
  sessionId: string,
  userId: string,
  captureMode: TelemetryCaptureMode = "full"
) {
  if (!hasTauriRuntime()) {
    return defaultTelemetryStatus;
  }

  return invoke<TelemetryStatus>("start_telemetry_capture", {
    sessionId,
    userId,
    captureMode
  });
}

export async function stopTelemetryCapture() {
  if (!hasTauriRuntime()) {
    return defaultTelemetryStatus;
  }

  return invoke<TelemetryStatus>("stop_telemetry_capture");
}

export async function getTelemetryStatus() {
  if (!hasTauriRuntime()) {
    return defaultTelemetryStatus;
  }

  return invoke<TelemetryStatus>("get_telemetry_status");
}

export async function getBufferHealth() {
  if (!hasTauriRuntime()) {
    return defaultBufferHealth;
  }

  return invoke<BufferHealth>("get_buffer_health");
}

export async function forceFlushTelemetry() {
  if (!hasTauriRuntime()) {
    return defaultTelemetryStatus;
  }

  return invoke<TelemetryStatus>("force_flush_telemetry");
}

export async function getActiveWindowInfo() {
  if (!hasTauriRuntime()) {
    return { focused: false } as ActiveWindowInfo;
  }

  return invoke<ActiveWindowInfo>("get_active_window_info");
}
