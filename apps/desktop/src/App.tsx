import { useSessionLifecycle } from "./hooks/useSessionLifecycle";
import { useSessionPoller } from "./hooks/useSessionPoller";
import { useTelemetryStatus } from "./hooks/useTelemetryStatus";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { ConnectionIndicator } from "./components/ConnectionIndicator";
import { TelemetryStatusBadge } from "./components/TelemetryStatusBadge";
import { LoginScreen } from "./screens/LoginScreen";
import { SessionSelectScreen } from "./screens/SessionSelectScreen";
import { ArmingScreen } from "./screens/ArmingScreen";
import { ActiveSessionScreen } from "./screens/ActiveSessionScreen";
import { PausedScreen } from "./screens/PausedScreen";
import { WarningScreen } from "./screens/WarningScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { CompletedScreen } from "./screens/CompletedScreen";
import {
  getCheckpointPrompt,
  getCurrentScreen,
  getEffectiveSessionState,
  useSessionStore
} from "./state/session-store";

export function App() {
  const lifecycle = useSessionLifecycle();
  const sessionStore = useSessionStore();
  const connection = useConnectionStatus();
  const telemetry = useTelemetryStatus();

  useSessionPoller();

  const currentScreen = getCurrentScreen(sessionStore);
  const session = sessionStore.session;
  const effectiveState = getEffectiveSessionState(
    sessionStore.session,
    sessionStore.optimisticState
  );
  const actionsDisabled = connection.state === "offline";

  return (
    <main style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ marginBottom: 4 }}>MedStudy OS Desktop</h1>
          <ConnectionIndicator
            state={connection.state}
            message={connection.lastError}
          />
        </div>
        <TelemetryStatusBadge
          status={telemetry.status}
          bufferHealth={telemetry.bufferHealth}
        />
      </header>

      {currentScreen === "login" ? (
        <LoginScreen onLogin={lifecycle.login} />
      ) : null}

      {currentScreen === "session-select" && sessionStore.auth ? (
        <SessionSelectScreen
          auth={sessionStore.auth}
          draft={sessionStore.sessionDraft}
          restoreSessionId={sessionStore.restoreSessionId}
          onDraftChange={sessionStore.updateSessionDraft}
          onRestoreSessionIdChange={sessionStore.setRestoreSessionId}
          onCreateSession={lifecycle.createSession}
          onRestoreSession={() =>
            lifecycle.restoreSession(sessionStore.restoreSessionId)
          }
          actionsDisabled={actionsDisabled}
        />
      ) : null}

      {currentScreen !== "login" && currentScreen !== "session-select" && session ? (
        <section style={contentStyle}>
          {currentScreen === "arming" ? (
            <ArmingScreen
              session={{
                ...session.session,
                state: effectiveState ?? session.session.state
              }}
              syncedAtMs={sessionStore.lastSyncedAtMs}
              onArm={lifecycle.armSession}
              onConfirmArm={lifecycle.confirmArmSession}
              onStart={lifecycle.startSession}
              actionsDisabled={actionsDisabled}
            />
          ) : null}
          {currentScreen === "active" ||
          (currentScreen === "warning" && effectiveState === "active_warning") ? (
            <ActiveSessionScreen
              session={{
                ...session.session,
                state: effectiveState ?? session.session.state
              }}
              syncedAtMs={sessionStore.lastSyncedAtMs}
              checkpoint={getCheckpointPrompt(session)}
              actionsDisabled={actionsDisabled}
              onPause={lifecycle.pauseSession}
              onRequestReview={lifecycle.requestReview}
              onSubmitArtifact={lifecycle.submitArtifact}
            />
          ) : null}
          {currentScreen === "paused" ? (
            <PausedScreen
              session={{
                ...session.session,
                state: effectiveState ?? session.session.state
              }}
              syncedAtMs={sessionStore.lastSyncedAtMs}
              actionsDisabled={actionsDisabled}
              onResume={lifecycle.resumeSession}
            />
          ) : null}
          {currentScreen === "warning" && effectiveState === "invalid_block" ? (
            <WarningScreen
              session={{
                ...session.session,
                state: effectiveState ?? session.session.state
              }}
              syncedAtMs={sessionStore.lastSyncedAtMs}
            />
          ) : null}
          {currentScreen === "review" ? (
            <ReviewScreen
              session={session.session}
              syncedAtMs={sessionStore.lastSyncedAtMs}
              actionsDisabled={actionsDisabled}
              onRequestReview={lifecycle.requestReview}
            />
          ) : null}
          {currentScreen === "completed" ? (
            <CompletedScreen
              session={session.session}
              syncedAtMs={sessionStore.lastSyncedAtMs}
              scoring={sessionStore.scoring}
            />
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "1.5rem",
  background:
    "linear-gradient(180deg, rgba(14,116,144,0.08), rgba(255,255,255,0.3)), #eef2f6",
  color: "#101828",
  fontFamily: "\"Segoe UI\", sans-serif"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  marginBottom: "1.5rem"
};

const contentStyle: React.CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto"
};
