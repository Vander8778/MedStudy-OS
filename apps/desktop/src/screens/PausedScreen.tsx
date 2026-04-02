import type { ResumeSessionRequest, SessionView } from "@medstudy/contracts";
import { SessionTimer } from "../components/SessionTimer";
import { StateIndicator } from "../components/StateIndicator";

export function PausedScreen({
  session,
  syncedAtMs,
  actionsDisabled,
  onResume
}: {
  session: SessionView;
  syncedAtMs?: number;
  actionsDisabled: boolean;
  onResume: (input: ResumeSessionRequest) => Promise<void>;
}) {
  return (
    <section style={panelStyle}>
      <StateIndicator state={session.state} />
      <h1>{session.title}</h1>
      <SessionTimer session={session} syncedAtMs={syncedAtMs} />
      <p>
        The backend currently has this session paused. Resume is disabled when the
        app is offline so the server remains the authority.
      </p>
      <button
        disabled={actionsDisabled}
        onClick={() =>
          void onResume({
            reason: "pause_within_limit",
            actor: {
              actorType: "user",
              userId: session.userId,
              label: "Desktop user"
            }
          })
        }
      >
        Resume Session
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
