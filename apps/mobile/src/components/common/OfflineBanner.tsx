import { Text, View } from "react-native";

export function OfflineBanner({
  isOnline,
  cacheState
}: {
  isOnline: boolean;
  cacheState?: "fresh" | "stale" | "expired" | "missing";
}) {
  if (isOnline && cacheState !== "stale") {
    return null;
  }

  const message = isOnline
    ? "Showing stale cached data. Pull to refresh when convenient."
    : "Offline mode: safe actions may queue, but live session truth still comes from the backend.";

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff3cd",
        borderBottomWidth: 1,
        borderBottomColor: "#f59e0b"
      }}
    >
      <Text style={{ color: "#7c2d12", fontWeight: "600" }}>{message}</Text>
    </View>
  );
}
