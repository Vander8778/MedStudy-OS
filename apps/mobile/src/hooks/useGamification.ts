import { useEffect } from "react";
import { useGamificationStore } from "../state/gamification-store";

export function useGamification() {
  const store = useGamificationStore();

  useEffect(() => {
    if (!store.progress && !store.isLoading) {
      void store.fetchProgress();
    }
  }, [store]);

  return store;
}
