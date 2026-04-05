import { useIsFocused } from "@react-navigation/native";
import { POLL_INTERVALS } from "../utils/constants";
import { usePolling } from "./usePolling";
import { useSessionStore } from "../state/session-store";

export function useSession(sessionId?: string) {
  const isFocused = useIsFocused();
  const store = useSessionStore();

  usePolling(
    async () => {
      if (sessionId) {
        await store.fetchSession(sessionId);
        return;
      }

      await store.fetchHome();
    },
    sessionId ? POLL_INTERVALS.sessionDetailMs : POLL_INTERVALS.homeMs,
    {
      enabled: true,
      isFocused
    }
  );

  return store;
}
