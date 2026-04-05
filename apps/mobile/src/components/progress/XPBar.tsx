import { Text, View } from "react-native";

export function XPBar({
  currentXP,
  xpToNextLevel
}: {
  currentXP: number;
  xpToNextLevel: number;
}) {
  const denominator = currentXP + xpToNextLevel;
  const progress = denominator > 0 ? Math.min(1, currentXP / denominator) : 0;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "700", color: "#0f172a" }}>
        XP {currentXP} / {denominator}
      </Text>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: "#e2e8f0" }}>
        <View
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: 10,
            borderRadius: 999,
            backgroundColor: "#2563eb"
          }}
        />
      </View>
    </View>
  );
}
