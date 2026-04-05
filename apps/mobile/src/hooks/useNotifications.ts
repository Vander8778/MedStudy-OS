import { useEffect } from "react";
import { configureNotificationHandling } from "../services/push-service";
import { useNotificationStore } from "../state/notification-store";

export function useNotifications() {
  const store = useNotificationStore();

  useEffect(() => {
    void configureNotificationHandling();
  }, []);

  return store;
}
