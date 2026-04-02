import type { CreateSessionRequest } from "@medstudy/contracts";
import type { AuthSession } from "../types";

export function SessionSelectScreen({
  auth,
  draft,
  restoreSessionId,
  onDraftChange,
  onRestoreSessionIdChange,
  onCreateSession,
  onRestoreSession,
  actionsDisabled
}: {
  auth: AuthSession;
  draft: CreateSessionRequest;
  restoreSessionId: string;
  onDraftChange: (patch: Partial<CreateSessionRequest>) => void;
  onRestoreSessionIdChange: (sessionId: string) => void;
  onCreateSession: () => Promise<void>;
  onRestoreSession: () => Promise<void>;
  actionsDisabled: boolean;
}) {
  return (
    <main style={screenStyle}>
      <section style={panelStyle}>
        <header>
          <h1>Ready To Study</h1>
          <p>Signed in as {auth.user.email}</p>
        </header>

        <div style={gridStyle}>
          <input
            value={draft.profileId}
            onChange={(event) => onDraftChange({ profileId: event.target.value })}
            placeholder="Profile ID"
          />
          <input
            value={draft.contractId}
            onChange={(event) => onDraftChange({ contractId: event.target.value })}
            placeholder="Contract ID"
          />
        </div>
        <input
          value={draft.title}
          onChange={(event) => onDraftChange({ title: event.target.value })}
          placeholder="Session title"
        />
        <textarea
          value={draft.objective}
          onChange={(event) => onDraftChange({ objective: event.target.value })}
          placeholder="Objective"
        />
        <div style={gridStyle}>
          <input
            value={draft.plannedRange.startsAt}
            onChange={(event) =>
              onDraftChange({
                plannedRange: {
                  ...draft.plannedRange,
                  startsAt: event.target.value
                }
              })
            }
            placeholder="Start time"
          />
          <input
            value={draft.plannedRange.endsAt}
            onChange={(event) =>
              onDraftChange({
                plannedRange: {
                  ...draft.plannedRange,
                  endsAt: event.target.value
                }
              })
            }
            placeholder="End time"
          />
        </div>
        <button disabled={actionsDisabled} onClick={() => void onCreateSession()}>
          Create Session
        </button>

        <hr />

        <input
          value={restoreSessionId}
          onChange={(event) => onRestoreSessionIdChange(event.target.value)}
          placeholder="Existing session ID"
        />
        <button disabled={actionsDisabled} onClick={() => void onRestoreSession()}>
          Restore Existing Session
        </button>
      </section>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "2rem",
  background: "#eef2f6"
};

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  maxWidth: "760px",
  margin: "0 auto",
  padding: "2rem",
  borderRadius: "1.5rem",
  background: "#fff"
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem"
};
