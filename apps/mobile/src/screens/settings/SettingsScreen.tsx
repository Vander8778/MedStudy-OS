import { Pressable, Text, View } from "react-native";
import { APP_VERSION } from "../../utils/constants";
import { useAuthStore } from "../../state/auth-store";
import { useNotificationStore } from "../../state/notification-store";

export function SettingsScreen() {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const preferences = useNotificationStore((state) => state.preferences);
  const auth = { session };

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>Settings</Text>
      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>
          {session?.profile?.displayName ?? session?.user.email ?? "Unknown user"}
        </Text>
        <Text style={{ color: "#475569" }}>
          {auth.session?.profile?.timezone ?? "Timezone unavailable"} ·{" "}
          {session?.profile?.locale ?? "Locale unavailable"}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>Notifications</Text>
        {Object.entries(preferences).map(([key, enabled]) => (
          <Text key={key} style={{ color: "#334155" }}>
            {key}: {enabled ? "on" : "off"}
          </Text>
        ))}
      </View>
      <Text style={{ color: "#475569" }}>App version: {APP_VERSION}</Text>
      <Pressable
        onPress={() => void signOut()}
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
