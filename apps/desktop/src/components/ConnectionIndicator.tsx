import type { ConnectionState } from "../types";

const colors: Record<ConnectionState, string> = {
  online: "#1d7f47",
  degraded: "#b7791f",
  offline: "#b42318"
};

export function ConnectionIndicator({
  state,
  message
}: {
  state: ConnectionState;
  message?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: "0.5rem",
        alignItems: "center",
        color: colors[state],
        fontWeight: 600
      }}
    >
      <span>{state.toUpperCase()}</span>
      {message ? <span style={{ fontWeight: 400 }}>{message}</span> : null}
    </div>
  );
}
