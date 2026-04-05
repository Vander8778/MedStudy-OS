import { Pressable, Text, View } from "react-native";

export function NotificationToast({
  toast,
  onDismiss
}: {
  toast: { type: "info" | "success" | "error"; message: string } | null;
  onDismiss: () => void;
}) {
  if (!toast) {
    return null;
  }

  const background =
    toast.type === "error"
      ? "#fee2e2"
      : toast.type === "success"
        ? "#dcfce7"
        : "#dbeafe";

  return (
    <Pressable
      onPress={onDismiss}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 24,
        zIndex: 10,
        padding: 14,
        borderRadius: 12,
        backgroundColor: background
      }}
    >
      <Text style={{ fontWeight: "700", color: "#0f172a" }}>{toast.message}</Text>
    </Pressable>
  );
}
