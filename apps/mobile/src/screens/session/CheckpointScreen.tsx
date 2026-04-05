import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { SessionStackParamList } from "../../types/navigation";
import { useSession } from "../../hooks/useSession";
import { useNotificationStore } from "../../state/notification-store";

export function CheckpointScreen() {
  const route = useRoute<RouteProp<SessionStackParamList, "Checkpoint">>();
  const session = useSession(route.params.sessionId);
  const isOnline = useNotificationStore((state) => state.isOnline);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const checkpoint = session.currentSession?.checkpoints.find(
    (item) => item.id === route.params.checkpointId
  );

  async function handleComplete() {
    setError(undefined);
    try {
      await session.completeCheckpoint(
        route.params.sessionId,
        route.params.checkpointId,
        note,
        isOnline
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Checkpoint rejected.");
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>
        {checkpoint?.title ?? "Checkpoint"}
      </Text>
      <Text style={{ color: "#475569" }}>
        Complete the checkpoint through the backend. If offline, this action queues safely.
      </Text>
      <TextInput
        multiline
        numberOfLines={5}
        value={note}
        onChangeText={setNote}
        placeholder="Optional note"
        style={{
          minHeight: 120,
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 14,
          textAlignVertical: "top"
        }}
      />
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      <Pressable
        onPress={() => void handleComplete()}
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: "#2563eb"
        }}
      >
        <Text style={{ textAlign: "center", color: "#ffffff", fontWeight: "700" }}>
          {isOnline ? "Complete checkpoint" : "Queue checkpoint completion"}
        </Text>
      </Pressable>
    </View>
  );
}
