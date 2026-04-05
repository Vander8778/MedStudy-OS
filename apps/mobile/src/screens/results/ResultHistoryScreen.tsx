import { Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { useSessionStore } from "../../state/session-store";
import type { SessionStackParamList } from "../../types/navigation";

export function ResultHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SessionStackParamList>>();
  const session = useSessionStore();

  return (
    <RefreshableScrollView onRefresh={() => void session.fetchResults()}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>
        Recent results
      </Text>
      {session.results.map((result) => (
        <Pressable
          key={result.session.id}
          onPress={() => navigation.navigate("SessionResult", { sessionId: result.session.id })}
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            backgroundColor: "#ffffff"
          }}
        >
          <Text style={{ fontWeight: "700", color: "#0f172a" }}>{result.session.title}</Text>
          <Text style={{ color: "#475569" }}>{result.session.state.replaceAll("_", " ")}</Text>
        </Pressable>
      ))}
    </RefreshableScrollView>
  );
}
