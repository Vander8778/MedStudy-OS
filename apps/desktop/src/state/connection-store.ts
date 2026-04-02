import { create } from "zustand";
import type { ConnectionState } from "../types";

type ConnectionStore = {
  state: ConnectionState;
  consecutiveFailures: number;
  lastError?: string;
  setOnline: () => void;
  recordFailure: (message: string) => void;
};

export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: "online",
  consecutiveFailures: 0,
  lastError: undefined,
  setOnline: () =>
    set({
      state: "online",
      consecutiveFailures: 0,
      lastError: undefined
    }),
  recordFailure: (message) =>
    set((current) => {
      const nextFailureCount = current.consecutiveFailures + 1;
      return {
        consecutiveFailures: nextFailureCount,
        state:
          nextFailureCount >= 3
            ? "offline"
            : nextFailureCount >= 2
              ? "degraded"
              : "online",
        lastError: message
      };
    })
}));
