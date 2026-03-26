export const USER_ROLES = ["student", "admin", "support", "system"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["invited", "active", "suspended", "archived"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PROFILE_STUDY_STAGES = ["preclinical", "clinical", "internship", "residency", "other"] as const;
export type ProfileStudyStage = (typeof PROFILE_STUDY_STAGES)[number];

export const CONTRACT_STATUSES = ["draft", "pending", "active", "paused", "completed", "cancelled", "expired"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const SESSION_STATES = [
  "planned",
  "arming",
  "armed",
  "active_valid",
  "active_warning",
  "paused_valid",
  "paused_expired",
  "invalid_block",
  "review_pending",
  "completed",
  "partial",
  "failed",
  "penalized",
  "excused"
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export const SESSION_BLOCK_TYPES = ["study", "pause", "break", "checkpoint", "review", "admin"] as const;
export type SessionBlockType = (typeof SESSION_BLOCK_TYPES)[number];

export const SESSION_EVENT_TYPES = [
  "planned",
  "arming_started",
  "armed",
  "started",
  "warning_raised",
  "warning_cleared",
  "paused",
  "resumed",
  "invalid_block_started",
  "checkpoint_due",
  "checkpoint_missed",
  "checkpoint_completed",
  "artifact_submitted",
  "review_requested",
  "review_started",
  "completed",
  "partial",
  "failed",
  "penalized",
  "excused"
] as const;
export type SessionEventType = (typeof SESSION_EVENT_TYPES)[number];

export const ACTOR_TYPES = ["user", "system", "admin", "ai_assistant"] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const TELEMETRY_SOURCES = ["desktop", "mobile", "web_admin", "backend", "system"] as const;
export type TelemetrySource = (typeof TELEMETRY_SOURCES)[number];

export const TELEMETRY_EVENT_TYPES = [
  "heartbeat",
  "focus_changed",
  "input_activity",
  "idle_detected",
  "window_changed",
  "url_changed",
  "process_snapshot",
  "manual_note"
] as const;
export type TelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];

export const CHECKPOINT_STATUSES = ["pending", "due", "completed", "missed", "excused"] as const;
export type CheckpointStatus = (typeof CHECKPOINT_STATUSES)[number];

export const ARTIFACT_TYPES = [
  "note",
  "summary",
  "flashcards",
  "quiz_result",
  "screenshot",
  "audio",
  "transcript",
  "file",
  "link",
  "viva_transcript",
  "final_submission"
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const ARTIFACT_STATUSES = ["pending", "submitted", "accepted", "rejected", "missing"] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const ARTIFACT_SOURCES = ["user_upload", "system_capture", "manual_entry", "external_link"] as const;
export type ArtifactSource = (typeof ARTIFACT_SOURCES)[number];

export const EVALUATION_TYPES = [
  "artifact_review",
  "checkpoint_review",
  "session_review",
  "viva_review",
  "contract_violation_review"
] as const;
export type EvaluationType = (typeof EVALUATION_TYPES)[number];

export const EVALUATION_STATUSES = ["pending", "passed", "failed", "needs_revision"] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const VIVA_ATTEMPT_STATUSES = ["scheduled", "in_progress", "passed", "failed", "cancelled", "expired"] as const;
export type VivaAttemptStatus = (typeof VIVA_ATTEMPT_STATUSES)[number];

export const PENALTY_TYPES = ["warning", "score_reduction", "session_failure", "strike", "cooldown"] as const;
export type PenaltyType = (typeof PENALTY_TYPES)[number];

export const PENALTY_REASONS = [
  "missed_checkpoint",
  "artifact_missing",
  "invalid_activity",
  "circumvention_attempt",
  "low_viva_score",
  "contract_violation"
] as const;
export type PenaltyReason = (typeof PENALTY_REASONS)[number];

export const PENALTY_STATUSES = ["pending", "active", "served", "revoked", "expired"] as const;
export type PenaltyStatus = (typeof PENALTY_STATUSES)[number];

export const AVATAR_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export type AvatarRarity = (typeof AVATAR_RARITIES)[number];

export const AVATAR_UNLOCK_SOURCES = ["onboarding", "streak", "mastery", "contract_completion", "admin_grant"] as const;
export type AvatarUnlockSource = (typeof AVATAR_UNLOCK_SOURCES)[number];

export const MASTERY_TRACK_STATUSES = ["locked", "active", "completed", "archived"] as const;
export type MasteryTrackStatus = (typeof MASTERY_TRACK_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "session_reminder",
  "checkpoint_due",
  "checkpoint_missed",
  "artifact_missing",
  "evaluation_ready",
  "penalty_issued",
  "viva_scheduled",
  "system_message"
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["in_app", "push", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["pending", "sent", "delivered", "read", "dismissed", "failed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const PROMPT_TEMPLATE_CATEGORIES = ["planning", "verification", "mini_viva", "explanation", "review_assist"] as const;
export type PromptTemplateCategory = (typeof PROMPT_TEMPLATE_CATEGORIES)[number];

export const PROMPT_TEMPLATE_STATUSES = ["draft", "active", "deprecated", "archived"] as const;
export type PromptTemplateStatus = (typeof PROMPT_TEMPLATE_STATUSES)[number];
