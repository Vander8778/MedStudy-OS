import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckpointPromptCard } from "../../components/session/CheckpointPromptCard";
import { SessionStatusCard } from "../../components/session/SessionStatusCard";
import { StreakBadge } from "../../components/progress/StreakBadge";
import { XPBar } from "../../components/progress/XPBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { useGamification } from "../../hooks/useGamification";
import { useSession } from "../../hooks/useSession";
import type { SessionStackParamList } from "../../types/navigation";
import type { HomeSummary } from "../../types/app";
import { formatScore } from "../../utils/formatters";

export function HomeScreenContent({
  summary,
  progressLoading,
  onOpenSession,
  onOpenCheckpoint,
  onOpenResult,
  onOpenAvatar,
  onRefresh
}: {
  summary: HomeSummary | null;
  progressLoading?: boolean;
  onOpenSession: (sessionId: string) => void;
  onOpenCheckpoint: (sessionId: string, checkpointId: string) => void;
  onOpenResult: (sessionId: string) => void;
  onOpenAvatar: () => void;
  onRefresh: () => void;
}) {
  if (!summary && progressLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <RefreshableScrollView onRefresh={onRefresh}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>Today</Text>

      {summary?.activeSession ? (
        <SessionStatusCard
          session={summary.activeSession}
          onPress={() => onOpenSession(summary.activeSession!.session.id)}
        />
      ) : summary?.plannedSession ? (
        <SessionStatusCard
          session={summary.plannedSession}
          onPress={() => onOpenSession(summary.plannedSession!.session.id)}
        />
      ) : (
        <Text style={{ color: "#64748b" }}>No active or planned session right now.</Text>
      )}

      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
          Due checkpoints
        </Text>
        {summary?.dueCheckpoints.length ? (
          summary.dueCheckpoints.map((checkpoint) => (
            <CheckpointPromptCard
              key={checkpoint.id}
              checkpoint={checkpoint}
              onPress={() => onOpenCheckpoint(checkpoint.sessionId, checkpoint.id)}
            />
          ))
        ) : (
          <Text style={{ color: "#64748b" }}>No due checkpoints.</Text>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
          Recent results
        </Text>
        {summary?.recentResults.length ? (
          summary.recentResults.map((result) => (
            <Pressable
              key={result.session.id}
              onPress={() => onOpenResult(result.session.id)}
              style={{
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: "#ffffff"
              }}
            >
              <Text style={{ fontWeight: "700", color: "#0f172a" }}>{result.session.title}</Text>
              <Text style={{ color: "#475569" }}>
                {result.session.state.replaceAll("_", " ")} · {formatScore(result.scoring?.sessionScore)}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={{ color: "#64748b" }}>No recent results yet.</Text>
        )}
      </View>

      <View
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: "#f8fafc",
          gap: 14
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
          Progress snapshot
        </Text>
        {summary?.progress ? (
          <>
            <XPBar
              currentXP={summary.progress.level.totalXP}
              xpToNextLevel={summary.progress.level.xpToNextLevel}
            />
            <StreakBadge
              currentLength={summary.progress.streak.currentLength}
              longestLength={summary.progress.streak.longestLength}
            />
          </>
        ) : (
          <Text style={{ color: "#64748b" }}>Progress will appear after the backend syncs it.</Text>
        )}
        <Pressable onPress={onOpenAvatar}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>Open avatar collection</Text>
        </Pressable>
      </View>
    </RefreshableScrollView>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SessionStackParamList>>();
  const session = useSession();
  const gamification = useGamification();

  return (
    <HomeScreenContent
      summary={session.homeSummary}
      progressLoading={session.isLoading || gamification.isLoading}
      onRefresh={() => {
        void session.fetchHome();
        void gamification.fetchProgress();
      }}
      onOpenSession={(sessionId) => navigation.navigate("SessionDetail", { sessionId })}
      onOpenCheckpoint={(sessionId, checkpointId) =>
        navigation.navigate("Checkpoint", { sessionId, checkpointId })
      }
      onOpenResult={(sessionId) => navigation.navigate("SessionResult", { sessionId })}
      onOpenAvatar={() => navigation.navigate("Avatar")}
    />
  );
}
