import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AvatarDisplay } from "../../components/progress/AvatarDisplay";
import { StreakBadge } from "../../components/progress/StreakBadge";
import { XPBar } from "../../components/progress/XPBar";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { useGamification } from "../../hooks/useGamification";
import type { SessionStackParamList } from "../../types/navigation";

export function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SessionStackParamList>>();
  const gamification = useGamification();
  const equipped = gamification.avatars.find((item) => item.equipped) ?? gamification.avatars[0];

  return (
    <RefreshableScrollView onRefresh={() => void gamification.fetchProgress()}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>Progress</Text>
      {gamification.progress ? (
        <>
          <XPBar
            currentXP={gamification.progress.level.totalXP}
            xpToNextLevel={gamification.progress.level.xpToNextLevel}
          />
          <StreakBadge
            currentLength={gamification.progress.streak.currentLength}
            longestLength={gamification.progress.streak.longestLength}
          />
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "700", color: "#0f172a" }}>Mastery tracks</Text>
            {gamification.progress.masteryTracks.map((track) => (
              <Text key={track.id} style={{ color: "#334155" }}>
                {track.name}: level {track.currentLevel}/{track.maxLevel} · {track.progressPercent}%
              </Text>
            ))}
          </View>
          {equipped ? <AvatarDisplay item={equipped} /> : null}
          <Pressable onPress={() => navigation.navigate("Avatar")}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>Open avatar screen</Text>
          </Pressable>
        </>
      ) : (
        <Text style={{ color: "#64748b" }}>Progress summary unavailable.</Text>
      )}
    </RefreshableScrollView>
  );
}
