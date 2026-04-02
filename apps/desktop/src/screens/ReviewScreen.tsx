import type { SessionActionRequest, SessionView } from "@medstudy/contracts";
import { SessionTimer } from "../components/SessionTimer";
import { StateIndicator } from "../components/StateIndicator";

export function ReviewScreen({
  session,
  syncedAtMs,
  actionsDisabled,
  onRequestReview
}: {
  session: SessionView;
  syncedAtMs?: number;
  actionsDisabled: boolean;
  onRequestReview: (input: SessionActionRequest) => Promise<void>;
}) {
  return (
    <section style={panelStyle}>
      <StateIndicator state={session.state} />
      <h1>{session.title}</h1>
      <SessionTimer session={session} syncedAtMs={syncedAtMs} />
      <p>The session is awaiting backend review and scoring.</p>
      <button
        disabled={actionsDisabled}
        onClick={() =>
          void onRequestReview({
            actor: {
              actorType: "user",
              userId: session.userId,
              label: "Desktop user"
            }
          })
        }
      >
        Refresh Review Request
      </button>
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
