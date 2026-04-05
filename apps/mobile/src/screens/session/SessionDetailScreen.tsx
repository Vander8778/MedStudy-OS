import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { SessionStateIndicator } from "../../components/session/SessionStateIndicator";
import { TimerDisplay } from "../../components/session/TimerDisplay";
import { useSession } from "../../hooks/useSession";
import { useNotificationStore } from "../../state/notification-store";
import type { SessionStackParamList } from "../../types/navigation";
import { formatDateTime, formatTimeRange } from "../../utils/formatters";

export function SessionDetailScreenContent({
  session,
  scoring,
  isOnline,
  onOpenContract,
  onOpenCheckpoint,
  onOpenArtifact,
  onOpenViva,
  onOpenResult,
  onRefresh
}: {
  session: ReturnType<typeof useSession>["currentSession"];
  scoring: ReturnType<typeof useSession>["scoring"];
  isOnline: boolean;
  onOpenContract: (contractId: string) => void;
  onOpenCheckpoint: (checkpointId: string) => void;
  onOpenArtifact: () => void;
  onOpenViva: () => void;
  onOpenResult: () => void;
  onRefresh: () => void;
}) {
  if (!session) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <RefreshableScrollView onRefresh={onRefresh}>
      <SessionStateIndicator state={session.session.state} />
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>
        {session.session.title}
      </Text>
      <Text style={{ color: "#475569" }}>{session.session.objective}</Text>
      <Text style={{ color: "#334155" }}>
        {formatTimeRange(
          session.session.plannedRange.startsAt,
          session.session.plannedRange.endsAt
        )}
      </Text>
      <TimerDisplay
        validMinutes={session.session.validMinutes}
        invalidMinutes={session.session.invalidMinutes}
      />
      <Pressable onPress={() => onOpenContract(session.session.contractId)}>
        <Text style={{ color: "#2563eb", fontWeight: "700" }}>Open contract details</Text>
      </Pressable>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Checkpoints</Text>
        {session.checkpoints.map((checkpoint) => (
          <Pressable
            key={checkpoint.id}
            onPress={() => onOpenCheckpoint(checkpoint.id)}
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e2e8f0"
            }}
          >
            <Text style={{ fontWeight: "700", color: "#0f172a" }}>{checkpoint.title}</Text>
            <Text style={{ color: "#475569" }}>
              {checkpoint.status} · Due {formatDateTime(checkpoint.dueAt)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Artifacts</Text>
        {session.artifacts.map((artifact) => (
          <View
            key={artifact.id}
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e2e8f0"
            }}
          >
            <Text style={{ fontWeight: "700", color: "#0f172a" }}>{artifact.title}</Text>
            <Text style={{ color: "#475569" }}>
              {artifact.type} · {artifact.status}
            </Text>
          </View>
        ))}
        <Pressable onPress={onOpenArtifact}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>
            {isOnline ? "Submit artifact" : "Queue artifact submission"}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Viva</Text>
        <Text style={{ color: "#475569" }}>
          {session.vivaAttempts.length
            ? `Latest status: ${session.vivaAttempts[0]?.status}`
            : "No viva attempt yet."}
        </Text>
        <Pressable disabled={!isOnline} onPress={onOpenViva}>
          <Text style={{ color: isOnline ? "#2563eb" : "#94a3b8", fontWeight: "700" }}>
            {isOnline ? "Open viva" : "Viva requires connectivity"}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ color: "#475569" }}>
          Warnings: {session.session.warningCount} · Missed checkpoints:{" "}
          {session.session.missedCheckpointCount}
        </Text>
        <Text style={{ color: "#475569" }}>Penalties: {session.penalties.length}</Text>
        <Text style={{ color: "#475569" }}>
          Score: {scoring ? `${scoring.sessionScore.toFixed(1)}%` : "Pending"}
        </Text>
      </View>

      <Pressable onPress={onOpenResult}>
        <Text style={{ color: "#2563eb", fontWeight: "700" }}>Open result summary</Text>
      </Pressable>
    </RefreshableScrollView>
  );
}

export function SessionDetailScreen() {
  const route = useRoute<RouteProp<SessionStackParamList, "SessionDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<SessionStackParamList>>();
  const session = useSession(route.params.sessionId);
  const isOnline = useNotificationStore((state) => state.isOnline);

  return (
    <SessionDetailScreenContent
      session={session.currentSession}
      scoring={session.scoring}
      isOnline={isOnline}
      onRefresh={() => void session.fetchSession(route.params.sessionId)}
      onOpenContract={(contractId) => navigation.navigate("ContractDetail", { contractId })}
      onOpenCheckpoint={(checkpointId) =>
        navigation.navigate("Checkpoint", {
          sessionId: route.params.sessionId,
          checkpointId
        })
      }
      onOpenArtifact={() =>
        navigation.navigate("ArtifactSubmit", { sessionId: route.params.sessionId })
      }
      onOpenViva={() => navigation.navigate("Viva", { sessionId: route.params.sessionId })}
      onOpenResult={() =>
        navigation.navigate("SessionResult", { sessionId: route.params.sessionId })
      }
    />
  );
}
