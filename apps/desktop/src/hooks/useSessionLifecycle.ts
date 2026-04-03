import { useEffect, useEffectEvent, useState } from "react";
import type {
  RequestReviewRequest,
  ResumeSessionRequest,
  SessionActionRequest,
  SubmitArtifactRequest
} from "@medstudy/contracts";
import { createApiClient } from "../services/api-client";
import {
  login as loginWithBackend,
  readStoredAuthSession,
  writeStoredAuthSession
} from "../services/auth";
import {
  clearPersistedSessionContext,
  getDesktopConfig,
  getPersistedSessionContext,
  persistSessionContext,
  startTelemetryCapture,
  stopTelemetryCapture
} from "../services/telemetry-bridge";
import {
  getSessionContextSyncDecision,
  getTelemetrySyncDecision
} from "../services/session-lifecycle";
import { useConnectionStore } from "../state/connection-store";
import { useSessionStore } from "../state/session-store";
import { isTerminalSessionState } from "../types";

export function useSessionLifecycle() {
  const sessionStore = useSessionStore();
  const connection = useConnectionStore();
  const authUserId = useSessionStore((state) => state.auth?.user.id);
  const sessionId = useSessionStore((state) => state.session?.session.id);
  const sessionState = useSessionStore((state) => state.session?.session.state);
  const sessionUserId = useSessionStore((state) => state.session?.session.userId);
  const [isHydrated, setIsHydrated] = useState(false);

  const requireOnline = useEffectEvent(() => {
    if (connection.state === "offline") {
      throw new Error("Authoritative session actions are disabled while offline.");
    }
  });

  useEffect(() => {
    async function hydrate() {
      const sessionStoreApi = useSessionStore.getState();
      const connectionStoreApi = useConnectionStore.getState();
      try {
        const [config, persistedContext] = await Promise.all([
          getDesktopConfig(),
          getPersistedSessionContext()
        ]);
        sessionStoreApi.setConfig(config);

        const storedAuth = readStoredAuthSession();
        if (storedAuth) {
          sessionStoreApi.setAuth(storedAuth);
        }

        if (persistedContext && storedAuth) {
          const api = createApiClient({
            backendUrl: config.backendUrl,
            token: storedAuth.token
          });
          try {
            const session = await api.getSession(persistedContext.sessionId);
            sessionStoreApi.setSession(session);
            if (isTerminalSessionState(session.session.state)) {
              await clearPersistedSessionContext();
            }
          } catch (error) {
            connectionStoreApi.recordFailure(
              error instanceof Error ? error.message : "Failed to restore session."
            );
          }
        }
      } finally {
        setIsHydrated(true);
      }
    }

    void hydrate();
  }, []);

  useEffect(() => {
    async function syncSessionContext() {
      const decision = getSessionContextSyncDecision({
        isHydrated,
        authUserId,
        sessionId,
        sessionUserId,
        sessionState
      });

      if (decision.action === "skip") {
        return;
      }

      if (decision.action === "clear") {
        await clearPersistedSessionContext();
        return;
      }

      await persistSessionContext(decision.sessionId, decision.userId);
    }

    void syncSessionContext();
  }, [authUserId, isHydrated, sessionId, sessionState, sessionUserId]);

  useEffect(() => {
    async function syncTelemetry() {
      const decision = getTelemetrySyncDecision({
        authUserId,
        sessionId,
        sessionState
      });

      if (decision.action === "stop") {
        await stopTelemetryCapture();
        return;
      }

      await startTelemetryCapture(
        decision.sessionId,
        decision.userId,
        decision.captureMode
      );
    }

    void syncTelemetry();
  }, [authUserId, sessionId, sessionState]);

  function getApi() {
    if (!sessionStore.config || !sessionStore.auth) {
      throw new Error("Desktop app is not ready yet.");
    }

    return createApiClient({
      backendUrl: sessionStore.config.backendUrl,
      token: sessionStore.auth.token
    });
  }

  async function login(email: string) {
    if (!sessionStore.config) {
      throw new Error("Desktop config has not loaded yet.");
    }
    const auth = await loginWithBackend(email, sessionStore.config.backendUrl);
    writeStoredAuthSession(auth);
    sessionStore.setAuth(auth);
    connection.setOnline();
  }

  async function restoreSession(sessionId: string) {
    requireOnline();
    const session = await getApi().getSession(sessionId);
    sessionStore.setSession(session);
    sessionStore.setRestoreSessionId("");
  }

  async function createSession() {
    requireOnline();
    const session = await getApi().createSession(sessionStore.sessionDraft);
    sessionStore.setSession(session);
  }

  async function armSession(input: SessionActionRequest) {
    requireOnline();
    const result = await getApi().armSession(sessionStore.session!.session.id, input);
    sessionStore.setSession({
      ...sessionStore.session!,
      session: result.session
    });
  }

  async function confirmArmSession(input: SessionActionRequest) {
    requireOnline();
    const result = await getApi().confirmArmSession(
      sessionStore.session!.session.id,
      input
    );
    sessionStore.setSession({
      ...sessionStore.session!,
      session: result.session
    });
  }

  async function startSession(input: SessionActionRequest) {
    requireOnline();
    const result = await getApi().startSession(sessionStore.session!.session.id, input);
    sessionStore.setSession({
      ...sessionStore.session!,
      session: result.session
    });
  }

  async function pauseSession(input: SessionActionRequest) {
    requireOnline();
    sessionStore.setOptimisticState("paused_valid");
    try {
      const result = await getApi().pauseSession(sessionStore.session!.session.id, input);
      sessionStore.setSession({
        ...sessionStore.session!,
        session: result.session
      });
      sessionStore.setOptimisticState(undefined);
    } catch (error) {
      sessionStore.setOptimisticState(undefined);
      throw error;
    }
  }

  async function resumeSession(input: ResumeSessionRequest) {
    requireOnline();
    sessionStore.setOptimisticState("active_valid");
    try {
      const result = await getApi().resumeSession(sessionStore.session!.session.id, input);
      sessionStore.setSession({
        ...sessionStore.session!,
        session: result.session
      });
      sessionStore.setOptimisticState(undefined);
    } catch (error) {
      sessionStore.setOptimisticState(undefined);
      throw error;
    }
  }

  async function submitArtifact(input: SubmitArtifactRequest) {
    requireOnline();
    const currentSession = sessionStore.session;
    if (!currentSession) {
      throw new Error("No session selected.");
    }
    const result = await getApi().submitArtifact(currentSession.session.id, input);
    sessionStore.setSession({
      ...currentSession,
      artifacts: [...currentSession.artifacts, result.artifact]
    });
  }

  async function requestReview(input: RequestReviewRequest) {
    requireOnline();
    const result = await getApi().requestReview(sessionStore.session!.session.id, input);
    sessionStore.setSession({
      ...sessionStore.session!,
      session: result.session
    });
    sessionStore.setScoring(result.scoring);
  }

  function logout() {
    writeStoredAuthSession(null);
    sessionStore.setAuth(null);
    sessionStore.clearSession();
    void clearPersistedSessionContext();
    void stopTelemetryCapture();
  }

  return {
    login,
    logout,
    createSession,
    restoreSession,
    armSession,
    confirmArmSession,
    startSession,
    pauseSession,
    resumeSession,
    submitArtifact,
    requestReview
  };
}
