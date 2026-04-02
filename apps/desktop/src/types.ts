import type {
  ArtifactView,
  CheckpointView,
  GetEventsResponse,
  GetScoringResponse,
  SessionAggregateResponse,
  SessionEventView,
  SessionState,
  SessionView
} from "@medstudy/contracts";

export type DesktopConfig = {
  backendUrl: string;
  pollIntervalMs: number;
  telemetryFlushIntervalMs: number;
  telemetryBufferMaxEvents: number;
  heartbeatIntervalMs: number;
  windowTrackIntervalMs: number;
  idleThresholdSeconds: number;
  uploadedRetentionSeconds: number;
  enableWindowTitleCapture: boolean;
  enableProcessNameCapture: boolean;
  enableInputActivityCapture: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type PersistedSessionContext = {
  sessionId: string;
  userId: string;
  persistedAt: string;
};

export type TelemetryStatus = {
  capturing: boolean;
  activeSessionId?: string;
  activeUserId?: string;
  queuedEvents: number;
  retainedUploadedEvents: number;
  lastFlushAt?: string;
  consecutiveFailureCount: number;
  nextRetryInMs: number;
  queueWarning: boolean;
  lastError?: string;
};

export type BufferHealth = {
  maxEvents: number;
  pendingEvents: number;
  retainedUploadedEvents: number;
  totalEvents: number;
  prunedUploadedEvents: number;
  prunedPendingEvents: number;
  queueWarning: boolean;
};

export type ActiveWindowInfo = {
  title?: string;
  processName?: string;
  focused: boolean;
};

export type ConnectionState = "online" | "degraded" | "offline";

export type ScreenKey =
  | "login"
  | "session-select"
  | "arming"
  | "active"
  | "paused"
  | "warning"
  | "review"
  | "completed";

export type SessionSnapshot = SessionAggregateResponse;
export type SessionScoringSnapshot = GetScoringResponse["scoring"];
export type SessionEventsSnapshot = GetEventsResponse["events"];

export type SessionCheckpointPrompt = CheckpointView | null;

export function isTerminalSessionState(state: SessionState): boolean {
  return [
    "completed",
    "partial",
    "failed",
    "penalized",
    "excused"
  ].includes(state);
}

export function isActiveTelemetryState(state: SessionState): boolean {
  return state === "active_valid" || state === "active_warning";
}

export function getDueCheckpoint(
  checkpoints: readonly CheckpointView[]
): SessionCheckpointPrompt {
  return checkpoints.find((checkpoint) => checkpoint.status === "due") ?? null;
}

export function resolveScreenKey(state?: SessionState): ScreenKey {
  if (!state) {
    return "session-select";
  }

  switch (state) {
    case "planned":
      return "session-select";
    case "arming":
    case "armed":
      return "arming";
    case "active_valid":
      return "active";
    case "active_warning":
    case "invalid_block":
      return "warning";
    case "paused_valid":
    case "paused_expired":
      return "paused";
    case "review_pending":
      return "review";
    case "completed":
    case "partial":
    case "failed":
    case "penalized":
    case "excused":
      return "completed";
  }
}

export function formatSessionLabel(session: SessionView) {
  return `${session.title} • ${session.state.replaceAll("_", " ")}`;
}

export function artifactCountLabel(artifacts: readonly ArtifactView[]) {
  return `${artifacts.length} artifact${artifacts.length === 1 ? "" : "s"}`;
}
