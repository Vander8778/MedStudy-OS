import type { SessionState } from "@medstudy/contracts";

export type SessionDisplay = {
  label: string;
  color: string;
  icon: string;
};

const SESSION_DISPLAY: Record<SessionState, SessionDisplay> = {
  planned: { label: "Planned", color: "#2563eb", icon: "calendar" },
  arming: { label: "Arming", color: "#7c3aed", icon: "shield" },
  armed: { label: "Armed", color: "#6d28d9", icon: "shield-check" },
  active_valid: { label: "In Focus", color: "#15803d", icon: "play" },
  active_warning: { label: "Warning", color: "#b45309", icon: "triangle-alert" },
  paused_valid: { label: "Paused", color: "#475569", icon: "pause" },
  paused_expired: { label: "Pause Expired", color: "#991b1b", icon: "clock-alert" },
  invalid_block: { label: "Blocked", color: "#991b1b", icon: "octagon-x" },
  review_pending: { label: "Under Review", color: "#7c2d12", icon: "search" },
  completed: { label: "Completed", color: "#166534", icon: "badge-check" },
  partial: { label: "Partial", color: "#a16207", icon: "scale" },
  failed: { label: "Failed", color: "#b91c1c", icon: "x-circle" },
  penalized: { label: "Penalized", color: "#7f1d1d", icon: "ban" },
  excused: { label: "Excused", color: "#0f766e", icon: "heart-handshake" }
};

export function getSessionDisplay(state?: string): SessionDisplay {
  if (!state || !(state in SESSION_DISPLAY)) {
    return {
      label: "Unknown",
      color: "#64748b",
      icon: "help-circle"
    };
  }

  return SESSION_DISPLAY[state as SessionState];
}
