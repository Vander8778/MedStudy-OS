import { useEffect, useState } from "react";
import type { SessionState, SessionView } from "@medstudy/contracts";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function isSmoothTimerState(state: SessionState) {
  return state === "active_valid" || state === "active_warning";
}

export function SessionTimer({
  session,
  syncedAtMs
}: {
  session: SessionView;
  syncedAtMs?: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const baseSeconds = Math.round(session.validMinutes * 60);
  const driftSeconds =
    syncedAtMs && isSmoothTimerState(session.state)
      ? Math.max(0, Math.floor((now - syncedAtMs) / 1_000))
      : 0;

  return (
    <div style={{ fontSize: "2rem", fontWeight: 700 }}>
      {formatDuration(baseSeconds + driftSeconds)}
    </div>
  );
}
