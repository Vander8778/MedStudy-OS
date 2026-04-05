import type {
  ArtifactView,
  Avatar,
  CheckpointView,
  ContractEvaluationSummaryView,
  ContractSummaryView,
  Notification,
  Profile,
  ProgressSummary,
  ScoringResultView,
  SessionAggregateResponse,
  SessionEventView,
  SessionGamificationReceipt,
  SessionState,
  User,
  VivaAttemptView
} from "@medstudy/contracts";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  tokens: AuthTokens;
  user: User;
  profile?: Profile;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
  profile?: Profile;
};

export type MeResponse = {
  user: User;
  profile?: Profile;
};

export type QueuedAction = {
  id: string;
  type: "checkpoint_complete" | "artifact_submit" | "avatar_equip";
  payload: Record<string, unknown>;
  queuedAt: string;
  status: "pending" | "submitting" | "failed";
  failureReason?: string;
  retryCount: number;
};

export type CacheEntry<T> = {
  cachedAt: string;
  data: T;
};

export type CacheFreshness = "fresh" | "stale" | "expired" | "missing";

export type SessionResultSummary = {
  session: SessionAggregateResponse["session"];
  scoring: ScoringResultView | null;
  contractEvaluation?: ContractEvaluationSummaryView;
  gamification?: SessionGamificationReceipt;
};

export type HomeSummary = {
  activeSession: SessionAggregateResponse | null;
  plannedSession: SessionAggregateResponse | null;
  dueCheckpoints: readonly CheckpointView[];
  recentResults: readonly SessionResultSummary[];
  progress: ProgressSummary | null;
};

export type VivaSummary = {
  sessionId: string;
  currentAttempt?: VivaAttemptView;
  attempts: readonly VivaAttemptView[];
  canAnswer: boolean;
  nextPrompt?: string;
  notes?: string;
};

export type VivaAnswerRequest = {
  answer: string;
};

export type VivaAnswerResponse = {
  viva: VivaSummary;
};

export type AvatarCatalogItem = {
  avatar: Avatar;
  unlocked: boolean;
  equipped: boolean;
  hint?: string;
};

export type AvatarCatalogResponse = {
  equippedAvatarId?: string;
  items: readonly AvatarCatalogItem[];
};

export type ProgressResponse = {
  progress: ProgressSummary;
  equippedAvatar?: Avatar;
  avatars: readonly AvatarCatalogItem[];
  recentXpAwards: readonly SessionGamificationReceipt[];
};

export type SessionCheckpointActionPayload = {
  sessionId: string;
  checkpointId: string;
  note?: string;
};

export type ArtifactSubmitPayload = {
  sessionId: string;
  artifact: {
    type: ArtifactView["type"];
    title: string;
    description?: string;
    uri?: string;
    source: ArtifactView["source"];
    status: ArtifactView["status"];
    metadata?: Record<string, unknown>;
  };
};

export type AvatarEquipPayload = {
  avatarId: string;
};

export type CurrentSessionLike = {
  id: string;
  state: SessionState;
  contractId: string;
};

export type NotificationsRegistrationResult = {
  pushToken?: string;
  registered: boolean;
};

export type PushPreferenceKey =
  | "session_reminder"
  | "checkpoint_due"
  | "checkpoint_missed"
  | "artifact_missing"
  | "session_result"
  | "viva_scheduled"
  | "streak_at_risk";

export type PushPreferences = Record<PushPreferenceKey, boolean>;

export type ResultsListResponse = {
  results: readonly SessionResultSummary[];
};

export type UserProfileCache = {
  me: MeResponse;
};

export type ContractCache = {
  contract: ContractSummaryView;
};

export type NotificationsListResponse = {
  notifications: readonly Notification[];
};

export type SessionEventsCache = {
  events: readonly SessionEventView[];
};
