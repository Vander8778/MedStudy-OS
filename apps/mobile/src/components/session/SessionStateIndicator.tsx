import { Text, View } from "react-native";
import type { SessionState } from "@medstudy/contracts";
import { getSessionDisplay } from "../../utils/session-display";

export function SessionStateIndicator({ state }: { state: SessionState }) {
  const display = getSessionDisplay(state);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: `${display.color}22`
      }}
    >
      <Text style={{ color: display.color, fontWeight: "700" }}>{display.label}</Text>
    </View>
  );
}
