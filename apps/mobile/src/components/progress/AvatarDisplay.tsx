import { Pressable, Text, View } from "react-native";
import type { AvatarCatalogItem } from "../../types/app";

export function AvatarDisplay({
  item,
  onPress
}: {
  item: AvatarCatalogItem;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={{
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: item.equipped ? "#2563eb" : "#e2e8f0",
        backgroundColor: item.unlocked ? "#ffffff" : "#f8fafc",
        gap: 6
      }}
    >
      <Text style={{ fontWeight: "700", color: "#0f172a" }}>{item.avatar.name}</Text>
      <Text style={{ color: "#64748b" }}>{item.avatar.rarity}</Text>
      <Text style={{ color: item.unlocked ? "#166534" : "#92400e" }}>
        {item.unlocked ? (item.equipped ? "Equipped" : "Unlocked") : item.hint ?? "Locked"}
      </Text>
    </Container>
  );
}
