import type { SessionState } from "@medstudy/contracts";

const stateColors: Record<SessionState, string> = {
  planned: "#2a6fdb",
  arming: "#ef9f27",
  armed: "#ef9f27",
  active_valid: "#1d7f47",
  active_warning: "#d9480f",
  paused_valid: "#59636e",
  paused_expired: "#8a5b00",
  invalid_block: "#b42318",
  review_pending: "#6941c6",
  completed: "#1d7f47",
  partial: "#8a5b00",
  failed: "#b42318",
  penalized: "#7a271a",
  excused: "#0e7490"
};

export function StateIndicator({ state }: { state: SessionState }) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "0.35rem 0.75rem",
        borderRadius: "999px",
        background: stateColors[state],
        color: "#fff",
        fontSize: "0.85rem",
        textTransform: "capitalize"
      }}
    >
      {state.replaceAll("_", " ")}
    </span>
  );
}
