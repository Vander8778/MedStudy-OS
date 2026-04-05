import { useEffect } from "react";
import { createApiClient } from "../services/api-client";
import { processQueuedActions } from "../services/cache-service";
import { MOBILE_API_BASE_URL } from "../utils/constants";
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
  const notificationStore = useNotificationStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void getNetInfoModule().then((NetInfo) => {
      if (!NetInfo) {
        notificationStore.setOnline(true);
        return;
      }

      unsubscribe = NetInfo.addEventListener((state) => {
        const nextOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
        const wasOffline = !useNotificationStore.getState().isOnline && nextOnline;
        useNotificationStore.getState().setOnline(nextOnline);

        if (wasOffline) {
          const client = createApiClient({
            backendUrl: MOBILE_API_BASE_URL,
            getAuthSession: async () => useAuthStore.getState().session,
            onAuthSession: async (session) => {
              useAuthStore.getState().setSession(session);
            }
          });

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
              await client.submitArtifactPayload({
                sessionId: String(action.payload.sessionId),
                artifact: action.payload.artifact as never
              });
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
  }, [notificationStore]);

  return {
    isOnline: notificationStore.isOnline
  };
}
