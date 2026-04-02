import type { SessionActionRequest, SessionView } from "@medstudy/contracts";
import { SessionTimer } from "../components/SessionTimer";
import { StateIndicator } from "../components/StateIndicator";

export function ArmingScreen({
  session,
  syncedAtMs,
  onArm,
  onConfirmArm,
  onStart,
  actionsDisabled
}: {
  session: SessionView;
  syncedAtMs?: number;
  onArm: (input: SessionActionRequest) => Promise<void>;
  onConfirmArm: (input: SessionActionRequest) => Promise<void>;
  onStart: (input: SessionActionRequest) => Promise<void>;
  actionsDisabled: boolean;
}) {
  const actor = {
    actor: {
      actorType: "user" as const,
      userId: session.userId,
      label: "Desktop user"
    }
  };

  return (
    <main style={screenStyle}>
      <section style={panelStyle}>
        <StateIndicator state={session.state} />
        <h1>{session.title}</h1>
        <p>{session.objective}</p>
        <SessionTimer session={session} syncedAtMs={syncedAtMs} />
        {session.state === "planned" ? (
          <button disabled={actionsDisabled} onClick={() => void onArm(actor)}>
            Arm Session
          </button>
        ) : null}
        {session.state === "arming" ? (
          <button
            disabled={actionsDisabled}
            onClick={() => void onConfirmArm(actor)}
          >
            Confirm Arm
          </button>
        ) : null}
        {session.state === "armed" ? (
          <button disabled={actionsDisabled} onClick={() => void onStart(actor)}>
            Start Session
          </button>
        ) : null}
      </section>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "2rem",
  background: "#eef2f6"
};

const panelStyle: React.CSSProperties = {
  width: "min(680px, 100%)",
  display: "grid",
  gap: "1rem",
  padding: "2rem",
  borderRadius: "1.5rem",
  background: "#fff"
};
