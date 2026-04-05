import { useEffect } from "react";
import { processQueuedActions } from "../services/cache-service";
import {
  getMobileApiClient,
  parseQueuedArtifactActionPayload
} from "../services/mobile-api";
import { useNotificationStore } from "../state/notification-store";
import { useAuthStore } from "../state/auth-store";
import { useGamificationStore } from "../state/gamification-store";
import { useSessionStore } from "../state/session-store";

async function getNetInfoModule() {
  try {
    return await import("@react-native-community/netinfo");
  } catch {
    return null;
  }
}

export function useOfflineCache() {
  const isOnline = useNotificationStore((state) => state.isOnline);
  const setOnline = useNotificationStore((state) => state.setOnline);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void getNetInfoModule().then((NetInfo) => {
      if (!NetInfo) {
        setOnline(true);
        return;
      }

      unsubscribe = NetInfo.addEventListener((state) => {
        const nextOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
        const wasOffline = !useNotificationStore.getState().isOnline && nextOnline;
        setOnline(nextOnline);

        if (wasOffline) {
          const client = getMobileApiClient();

          void processQueuedActions({
            checkpoint_complete: async (action) => {
              await client.completeCheckpoint(
                String(action.payload.sessionId),
                String(action.payload.checkpointId),
                {
                  actor: {
                    actorType: "user",
                    userId: useAuthStore.getState().session?.user.id
                  },
                  note:
                    typeof action.payload.note === "string"
                      ? action.payload.note
                      : undefined
                }
              );
            },
            artifact_submit: async (action) => {
              const parsed = parseQueuedArtifactActionPayload(action.payload);
              await client.submitArtifactPayload(parsed);
            },
            avatar_equip: async (action) => {
              await client.equipAvatar(String(action.payload.avatarId));
            }
          }).then(() => {
            void useSessionStore.getState().fetchHome();
            void useGamificationStore.getState().fetchProgress();
          });
        }
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [setOnline]);

  return {
    isOnline
  };
}
