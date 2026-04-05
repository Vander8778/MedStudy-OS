import { create } from "zustand";
import { getMobileApiClient } from "../services/mobile-api";
import { registerForPushNotificationsAsync } from "../services/push-service";
import type { PushPreferences } from "../types/app";

type ToastState = {
  type: "info" | "success" | "error";
  message: string;
} | null;

type NotificationStore = {
  isOnline: boolean;
  pushToken?: string;
  pushEnabled: boolean;
  preferences: PushPreferences;
  toast: ToastState;
  error?: string;
  registerPush: () => Promise<void>;
  setOnline: (isOnline: boolean) => void;
  showToast: (toast: NonNullable<ToastState>) => void;
  dismissToast: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  isOnline: true,
  pushToken: undefined,
  pushEnabled: false,
  preferences: {
    session_reminder: true,
    checkpoint_due: true,
    checkpoint_missed: true,
    artifact_missing: true,
    session_result: true,
    viva_scheduled: true,
    streak_at_risk: true
  },
  toast: null,
  error: undefined,
  async registerPush() {
    try {
      const result = await registerForPushNotificationsAsync();
      if (result.pushToken) {
        await getMobileApiClient().registerPushToken(result.pushToken);
      }

      set({
        pushToken: result.pushToken,
        pushEnabled: result.registered,
        error: undefined
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Push registration failed."
      });
    }
  },
  setOnline(isOnline) {
    set({ isOnline });
  },
  showToast(toast) {
    set({ toast });
  },
  dismissToast() {
    set({ toast: null });
  }
}));
