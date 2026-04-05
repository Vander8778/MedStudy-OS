import { useEffect } from "react";
import { useGamificationStore } from "../state/gamification-store";

export function useGamification() {
  const progress = useGamificationStore((state) => state.progress);
  const avatars = useGamificationStore((state) => state.avatars);
  const equippedAvatarId = useGamificationStore((state) => state.equippedAvatarId);
  const recentXpAwards = useGamificationStore((state) => state.recentXpAwards);
  const isLoading = useGamificationStore((state) => state.isLoading);
  const error = useGamificationStore((state) => state.error);
  const cacheState = useGamificationStore((state) => state.cacheState);
  const fetchProgress = useGamificationStore((state) => state.fetchProgress);
  const equipAvatar = useGamificationStore((state) => state.equipAvatar);
  const invalidate = useGamificationStore((state) => state.invalidate);

  useEffect(() => {
    if (!progress && !isLoading) {
      void fetchProgress();
    }
  }, [fetchProgress, isLoading, progress]);

  return {
    progress,
    avatars,
    equippedAvatarId,
    recentXpAwards,
    isLoading,
    error,
    cacheState,
    fetchProgress,
    equipAvatar,
    invalidate
  };
}
