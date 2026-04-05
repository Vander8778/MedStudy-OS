import { Text, View } from "react-native";
import { formatMinutes } from "../../utils/formatters";

export function TimerDisplay({
  validMinutes,
  invalidMinutes
}: {
  validMinutes: number;
  invalidMinutes: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 16 }}>
      <View>
        <Text style={{ fontSize: 12, color: "#64748b" }}>Valid</Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f766e" }}>
          {formatMinutes(validMinutes)}
        </Text>
      </View>
      <View>
        <Text style={{ fontSize: 12, color: "#64748b" }}>Invalid</Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#b91c1c" }}>
          {formatMinutes(invalidMinutes)}
        </Text>
      </View>
    </View>
  );
}
