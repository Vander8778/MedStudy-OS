import { useEffect, useEffectEvent } from "react";
import { createApiClient } from "../services/api-client";
import { forceFlushTelemetry } from "../services/telemetry-bridge";
import {
  getSessionPollIntervalMs,
  shouldFetchReviewData
} from "../services/session-poller";
import { useConnectionStore } from "../state/connection-store";
import {
  getEffectiveSessionState,
  useSessionStore
} from "../state/session-store";

export function useSessionPoller() {
  const config = useSessionStore((state) => state.config);
  const auth = useSessionStore((state) => state.auth);
  const session = useSessionStore((state) => state.session);
  const optimisticState = useSessionStore((state) => state.optimisticState);
  const setSession = useSessionStore((state) => state.setSession);
  const setScoring = useSessionStore((state) => state.setScoring);
  const setEvents = useSessionStore((state) => state.setEvents);
  const scoring = useSessionStore((state) => state.scoring);
  const events = useSessionStore((state) => state.events);
  const connection = useConnectionStore();

  const pollOnce = useEffectEvent(async () => {
    if (!config || !auth || !session) {
      return;
    }

    try {
      const api = createApiClient({
        backendUrl: config.backendUrl,
        token: auth.token
      });
      const nextSession = await api.getSession(session.session.id);
      setSession(nextSession);

      if (
        shouldFetchReviewData({
          previousState: session.session.state,
          nextState: nextSession.session.state,
          hasScoring: Boolean(scoring),
          hasEvents: events.length > 0
        })
      ) {
        const [scoring, events] = await Promise.all([
          api.getScoring(nextSession.session.id),
          api.getEvents(nextSession.session.id)
        ]);
        setScoring(scoring.scoring);
        setEvents(events.events);
      }

      if (connection.state !== "online") {
        connection.setOnline();
        await forceFlushTelemetry();
      }
    } catch (error) {
      connection.recordFailure(
        error instanceof Error ? error.message : "Failed to reconcile session."
      );
    }
  });

  useEffect(() => {
    const effectiveState = getEffectiveSessionState(session, optimisticState);
    const intervalMs = getSessionPollIntervalMs(
      effectiveState,
      config?.pollIntervalMs ?? 5_000
    );

    if (!session || !config || !auth || intervalMs <= 0) {
      return;
    }

    void pollOnce();
    const timer = window.setInterval(() => {
      void pollOnce();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [auth, config, optimisticState, pollOnce, session]);
}
