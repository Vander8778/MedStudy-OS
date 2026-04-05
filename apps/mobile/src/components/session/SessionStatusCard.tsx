import { Pressable, Text, View } from "react-native";
import type { SessionAggregateResponse } from "@medstudy/contracts";
import { formatTimeRange } from "../../utils/formatters";
import { SessionStateIndicator } from "./SessionStateIndicator";
import { TimerDisplay } from "./TimerDisplay";

export function SessionStatusCard({
  session,
  onPress
}: {
  session: SessionAggregateResponse;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 12
      }}
    >
      <SessionStateIndicator state={session.session.state} />
      <View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
          {session.session.title}
        </Text>
        <Text style={{ color: "#475569", marginTop: 4 }}>{session.session.objective}</Text>
      </View>
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
    </Container>
  );
}
