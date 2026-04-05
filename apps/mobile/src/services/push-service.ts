import type { NotificationsRegistrationResult } from "../types/app";

export async function registerForPushNotificationsAsync(): Promise<NotificationsRegistrationResult> {
  try {
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");
    const Constants = await import("expo-constants");

    if (!Device.isDevice) {
      return { registered: false };
    }

    const permissions = await Notifications.getPermissionsAsync();
    let status = permissions.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== "granted") {
      return { registered: false };
    }

    const projectId =
      Constants.default.expoConfig?.extra?.eas?.projectId ??
      Constants.default.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return {
      pushToken: token.data,
      registered: true
    };
  } catch {
    return { registered: false };
  }
}

export async function configureNotificationHandling() {
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });
  } catch {
    // No-op in test and unsupported environments.
  }
}
