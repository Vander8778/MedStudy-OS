import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

export function LoginScreen() {
  const auth = useAuth();
  const notifications = useNotifications();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    await auth.signIn(email, password);
    await notifications.registerPush();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>MedStudy OS</Text>
      <Text style={{ color: "#475569" }}>
        Mobile is a companion surface. Session truth stays on the backend.
      </Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 14
        }}
      />
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 14
        }}
      />
      {auth.error ? <Text style={{ color: "#b91c1c" }}>{auth.error}</Text> : null}
      <Pressable
        onPress={() => void handleLogin()}
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: "#2563eb"
        }}
      >
        <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "700" }}>
          {auth.isLoading ? "Signing in..." : "Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}
