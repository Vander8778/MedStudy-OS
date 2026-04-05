import { useEffect } from "react";
import { useAuthStore } from "../state/auth-store";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.session && !store.isHydrating) {
      void store.hydrate();
    }
  }, [store]);

  return store;
}
