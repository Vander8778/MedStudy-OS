import { Pressable, Text, View } from "react-native";
import { APP_VERSION } from "../../utils/constants";
import { useAuthStore } from "../../state/auth-store";
import { useNotificationStore } from "../../state/notification-store";

export function SettingsScreen() {
  const auth = useAuthStore();
  const notifications = useNotificationStore();

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>Settings</Text>
      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>
          {auth.session?.profile?.displayName ?? auth.session?.user.email ?? "Unknown user"}
        </Text>
        <Text style={{ color: "#475569" }}>
          {auth.session?.profile?.timezone ?? "Timezone unavailable"} ·{" "}
          {auth.session?.profile?.locale ?? "Locale unavailable"}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>Notifications</Text>
        {Object.entries(notifications.preferences).map(([key, enabled]) => (
          <Text key={key} style={{ color: "#334155" }}>
            {key}: {enabled ? "on" : "off"}
          </Text>
        ))}
      </View>
      <Text style={{ color: "#475569" }}>App version: {APP_VERSION}</Text>
      <Pressable
        onPress={() => void auth.signOut()}
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: "#111827"
        }}
      >
        <Text style={{ textAlign: "center", color: "#ffffff", fontWeight: "700" }}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}
