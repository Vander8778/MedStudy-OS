import type { GetScoringResponse, SessionView } from "@medstudy/contracts";
import { SessionTimer } from "../components/SessionTimer";
import { StateIndicator } from "../components/StateIndicator";

export function CompletedScreen({
  session,
  syncedAtMs,
  scoring
}: {
  session: SessionView;
  syncedAtMs?: number;
  scoring: GetScoringResponse["scoring"];
}) {
  return (
    <section style={panelStyle}>
      <StateIndicator state={session.state} />
      <h1>{session.title}</h1>
      <SessionTimer session={session} syncedAtMs={syncedAtMs} />
      <p>Backend outcome: {session.state.replaceAll("_", " ")}</p>
      {scoring ? (
        <div>
          <strong>Score</strong>
          <div>{scoring.sessionScore}</div>
          <div>Outcome: {scoring.outcome}</div>
        </div>
      ) : (
        <p>Scoring details are still loading.</p>
      )}
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
