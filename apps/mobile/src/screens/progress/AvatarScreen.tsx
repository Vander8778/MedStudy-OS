import { Text } from "react-native";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { AvatarDisplay } from "../../components/progress/AvatarDisplay";
import { useGamification } from "../../hooks/useGamification";
import { useNotificationStore } from "../../state/notification-store";

export function AvatarScreen() {
  const gamification = useGamification();
  const isOnline = useNotificationStore((state) => state.isOnline);

  return (
    <RefreshableScrollView onRefresh={() => void gamification.fetchProgress()}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>Avatar collection</Text>
      {gamification.avatars.map((item) => (
        <AvatarDisplay
          key={item.avatar.id}
          item={item}
          onPress={() => void gamification.equipAvatar(item.avatar.id, isOnline)}
        />
      ))}
    </RefreshableScrollView>
  );
}
