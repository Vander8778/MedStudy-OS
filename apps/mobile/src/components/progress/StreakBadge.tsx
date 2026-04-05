import { Text, View } from "react-native";

export function StreakBadge({
  currentLength,
  longestLength
}: {
  currentLength: number;
  longestLength: number;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: "#fff7ed",
        borderWidth: 1,
        borderColor: "#fdba74"
      }}
    >
      <Text style={{ color: "#9a3412", fontWeight: "700" }}>
        Streak {currentLength} days
      </Text>
      <Text style={{ color: "#c2410c" }}>Best {longestLength}</Text>
    </View>
  );
}
