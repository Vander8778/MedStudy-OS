import { create } from "zustand";
import { MOBILE_API_BASE_URL } from "../utils/constants";
import type { AuthSession } from "../types/app";
import { login, logout, readStoredAuthSession } from "../services/auth-service";

type AuthStore = {
  session: AuthSession | null;
  isHydrating: boolean;
  isLoading: boolean;
  error?: string;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isHydrating: false,
  isLoading: false,
  error: undefined,
  async hydrate() {
    set({ isHydrating: true, error: undefined });
    try {
      const session = await readStoredAuthSession();
      set({ session, isHydrating: false });
    } catch (error) {
      set({
        isHydrating: false,
        error: error instanceof Error ? error.message : "Failed to restore login."
      });
    }
  },
  async signIn(email, password) {
    set({ isLoading: true, error: undefined });
    try {
      const session = await login(MOBILE_API_BASE_URL, { email, password });
      set({ session, isLoading: false });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  async signOut() {
    await logout();
    set({ session: null, error: undefined });
  },
  setSession(session) {
    set({ session });
  }
}));
