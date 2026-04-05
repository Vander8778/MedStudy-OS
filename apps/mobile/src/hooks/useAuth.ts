import { useEffect } from "react";
import { useAuthStore } from "../state/auth-store";

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const hydrate = useAuthStore((state) => state.hydrate);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (!session && !isHydrating) {
      void hydrate();
    }
  }, [hydrate, isHydrating, session]);

  return {
    session,
    isHydrating,
    isLoading,
    error,
    hydrate,
    signIn,
    signOut,
    setSession
  };
}
