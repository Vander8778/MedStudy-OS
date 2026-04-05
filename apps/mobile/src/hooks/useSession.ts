import { useIsFocused } from "@react-navigation/native";
import { POLL_INTERVALS } from "../utils/constants";
import { usePolling } from "./usePolling";
import { useSessionStore } from "../state/session-store";

export function useSession(sessionId?: string) {
  const isFocused = useIsFocused();
  const homeSummary = useSessionStore((state) => state.homeSummary);
  const currentSession = useSessionStore((state) => state.currentSession);
  const scoring = useSessionStore((state) => state.scoring);
  const events = useSessionStore((state) => state.events);
  const results = useSessionStore((state) => state.results);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);
  const lastFetchedAt = useSessionStore((state) => state.lastFetchedAt);
  const cacheState = useSessionStore((state) => state.cacheState);
  const fetchHome = useSessionStore((state) => state.fetchHome);
  const fetchSession = useSessionStore((state) => state.fetchSession);
  const fetchResults = useSessionStore((state) => state.fetchResults);
  const completeCheckpoint = useSessionStore((state) => state.completeCheckpoint);
  const submitArtifact = useSessionStore((state) => state.submitArtifact);
  const invalidate = useSessionStore((state) => state.invalidate);

  usePolling(
    async () => {
      if (sessionId) {
        await fetchSession(sessionId);
        return;
      }

      await fetchHome();
    },
    sessionId ? POLL_INTERVALS.sessionDetailMs : POLL_INTERVALS.homeMs,
    {
      enabled: true,
      isFocused
    }
  );

  return {
    homeSummary,
    currentSession,
    scoring,
    events,
    results,
    isLoading,
    error,
    lastFetchedAt,
    cacheState,
    fetchHome,
    fetchSession,
    fetchResults,
    completeCheckpoint,
    submitArtifact,
    invalidate
  };
}
