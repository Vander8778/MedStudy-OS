import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { getMobileApiClient } from "../../services/mobile-api";
import { useNotificationStore } from "../../state/notification-store";
import type { SessionStackParamList } from "../../types/navigation";
import type { VivaSummary } from "../../types/app";
import { getVivaConnectivityMessage } from "../../utils/screen-models";

export function VivaScreen() {
  const route = useRoute<RouteProp<SessionStackParamList, "Viva">>();
  const isOnline = useNotificationStore((state) => state.isOnline);
  const [viva, setViva] = useState<VivaSummary | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string>();
  const client = getMobileApiClient();
  const connectivityMessage = getVivaConnectivityMessage(isOnline);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    // Viva is intentionally kept screen-local for MVP because it is conversational,
    // connectivity-bound, and not yet reused across tabs or offline cache surfaces.
    void client
      .getViva(route.params.sessionId)
      .then(setViva)
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Viva unavailable.");
      });
  }, [client, isOnline, route.params.sessionId]);

  async function handleSubmit() {
    if (!isOnline) {
      setError("Viva requires connectivity and cannot be queued offline.");
      return;
    }

    const result = await client.submitVivaAnswer(route.params.sessionId, { answer });
    setViva(result.viva);
    setAnswer("");
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Viva</Text>
      {connectivityMessage ? <Text style={{ color: "#b91c1c" }}>{connectivityMessage}</Text> : null}
      {viva?.nextPrompt ? <Text style={{ color: "#0f172a" }}>{viva.nextPrompt}</Text> : null}
      <Text style={{ color: "#475569" }}>
        {viva?.notes ?? "The backend controls viva availability and evaluation."}
      </Text>
      <TextInput
        multiline
        numberOfLines={5}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Type your answer"
        style={{
          minHeight: 140,
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 14,
          textAlignVertical: "top"
        }}
      />
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      <Pressable
        disabled={!isOnline}
        onPress={() => void handleSubmit()}
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: isOnline ? "#2563eb" : "#94a3b8"
        }}
      >
        <Text style={{ textAlign: "center", color: "#ffffff", fontWeight: "700" }}>
          Submit answer
        </Text>
      </Pressable>
    </View>
  );
}
