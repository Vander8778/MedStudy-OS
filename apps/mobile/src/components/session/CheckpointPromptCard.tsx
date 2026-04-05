import { Pressable, Text, View } from "react-native";
import type { CheckpointView } from "@medstudy/contracts";
import { formatDateTime } from "../../utils/formatters";

export function CheckpointPromptCard({
  checkpoint,
  onPress
}: {
  checkpoint: CheckpointView;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={{
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#fffbeb",
        borderWidth: 1,
        borderColor: "#fcd34d",
        gap: 4
      }}
    >
      <Text style={{ fontWeight: "700", color: "#92400e" }}>{checkpoint.title}</Text>
      <Text style={{ color: "#78350f" }}>Due {formatDateTime(checkpoint.dueAt)}</Text>
    </Container>
  );
}
