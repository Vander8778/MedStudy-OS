import { NavigationContainer } from "@react-navigation/native";
import { View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useOfflineCache } from "../hooks/useOfflineCache";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { OfflineBanner } from "../components/common/OfflineBanner";
import { NotificationToast } from "../components/notifications/NotificationToast";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import { useSessionStore } from "../state/session-store";

export function RootNavigator() {
  const auth = useAuth();
  const notifications = useNotifications();
  const sessionStore = useSessionStore();
  useOfflineCache();

  if (auth.isHydrating) {
    return <LoadingSkeleton rows={4} />;
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <OfflineBanner
          isOnline={notifications.isOnline}
          cacheState={sessionStore.cacheState}
        />
        <View style={{ flex: 1 }}>
          {auth.session ? <MainTabNavigator /> : <AuthNavigator />}
        </View>
        <NotificationToast toast={notifications.toast} onDismiss={notifications.dismissToast} />
      </View>
    </NavigationContainer>
  );
}
