import type {
  CheckpointView,
  SessionActionRequest,
  SessionView,
  SubmitArtifactRequest
} from "@medstudy/contracts";
import { ArtifactSubmitDialog } from "../components/ArtifactSubmitDialog";
import { CheckpointPrompt } from "../components/CheckpointPrompt";
import { SessionTimer } from "../components/SessionTimer";
import { StateIndicator } from "../components/StateIndicator";
import { WarningBanner } from "../components/WarningBanner";

export function ActiveSessionScreen({
  session,
  syncedAtMs,
  checkpoint,
  actionsDisabled,
  onPause,
  onRequestReview,
  onSubmitArtifact
}: {
  session: SessionView;
  syncedAtMs?: number;
  checkpoint: CheckpointView | null;
  actionsDisabled: boolean;
  onPause: (input: SessionActionRequest) => Promise<void>;
  onRequestReview: (input: SessionActionRequest) => Promise<void>;
  onSubmitArtifact: (input: SubmitArtifactRequest) => Promise<void>;
}) {
  const actor = {
    actor: {
      actorType: "user" as const,
      userId: session.userId,
      label: "Desktop user"
    }
  };

  return (
    <section style={panelStyle}>
      <StateIndicator state={session.state} />
      <h1>{session.title}</h1>
      <SessionTimer session={session} syncedAtMs={syncedAtMs} />
      {session.state === "active_warning" ? (
        <WarningBanner
          title="Warning active"
          message="The backend has marked the session as warning state. Recover promptly to avoid escalation."
        />
      ) : null}
      <CheckpointPrompt checkpoint={checkpoint} />
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button disabled={actionsDisabled} onClick={() => void onPause(actor)}>
          Pause
        </button>
        <button disabled={actionsDisabled} onClick={() => void onRequestReview(actor)}>
          Request Review
        </button>
      </div>
      <ArtifactSubmitDialog disabled={actionsDisabled} onSubmit={onSubmitArtifact} />
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
