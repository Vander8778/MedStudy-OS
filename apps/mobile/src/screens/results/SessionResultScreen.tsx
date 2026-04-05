import { Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { useSession } from "../../hooks/useSession";
import type { SessionStackParamList } from "../../types/navigation";

export function SessionResultScreen() {
  const route = useRoute<RouteProp<SessionStackParamList, "SessionResult">>();
  const session = useSession(route.params.sessionId);
  const result = session.results.find((item) => item.session.id === route.params.sessionId);

  return (
    <RefreshableScrollView
      onRefresh={() => {
        void session.fetchSession(route.params.sessionId);
        void session.fetchResults();
      }}
    >
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>
        Session result
      </Text>
      <Text style={{ color: "#475569" }}>
        Outcome: {result?.session.state ?? session.currentSession?.session.state ?? "Pending"}
      </Text>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>Scoring</Text>
        <Text style={{ color: "#334155" }}>
          Weighted score: {result?.scoring?.sessionScore ?? session.scoring?.sessionScore ?? "Pending"}
        </Text>
        <Text style={{ color: "#334155" }}>
          Hard fail:{" "}
          {String(result?.scoring?.hardFailTriggered ?? session.scoring?.hardFailTriggered ?? false)}
        </Text>
        <Text style={{ color: "#334155" }}>
          Hard fail reasons:{" "}
          {(result?.scoring?.hardFailReasons ?? session.scoring?.hardFailReasons ?? []).join(", ") ||
            "None"}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>Contract evaluation</Text>
        <Text style={{ color: "#334155" }}>
          Critical violations:{" "}
          {result?.contractEvaluation?.criticalViolationCodes.join(", ") || "None"}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>Session summary</Text>
        <Text style={{ color: "#334155" }}>
          Checkpoints: {session.currentSession?.checkpoints.length ?? 0}
        </Text>
        <Text style={{ color: "#334155" }}>
          Artifacts: {session.currentSession?.artifacts.length ?? 0}
        </Text>
        <Text style={{ color: "#334155" }}>
          Penalties: {session.currentSession?.penalties.length ?? 0}
        </Text>
      </View>
    </RefreshableScrollView>
  );
}
