import type { SessionView } from "@medstudy/contracts";
import { SessionTimer } from "../components/SessionTimer";
import { StateIndicator } from "../components/StateIndicator";
import { WarningBanner } from "../components/WarningBanner";

export function WarningScreen({
  session,
  syncedAtMs
}: {
  session: SessionView;
  syncedAtMs?: number;
}) {
  return (
    <section style={panelStyle}>
      <StateIndicator state={session.state} />
      <h1>{session.title}</h1>
      <SessionTimer session={session} syncedAtMs={syncedAtMs} />
      <WarningBanner
        title="Backend intervention required"
        message="The session is currently in a warning or invalid state. Local UI remains read-only until the backend reports recovery."
      />
    </section>
  );
}

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  padding: "2rem",
  borderRadius: "1.5rem",
  background: "#fff"
};
