import type { GetContractResponse } from "@medstudy/contracts";
import { create } from "zustand";
import { createApiClient } from "../services/api-client";
import {
  CACHE_KEYS,
  getCacheFreshness,
  readCacheEntry,
  writeCacheEntry
} from "../services/cache-service";
import { MOBILE_API_BASE_URL } from "../utils/constants";
import { useAuthStore } from "./auth-store";

type ContractStore = {
  contract: GetContractResponse["contract"] | null;
  isLoading: boolean;
  error?: string;
  cacheState: "fresh" | "stale" | "expired" | "missing";
  fetchContract: (contractId: string) => Promise<GetContractResponse["contract"] | null>;
  invalidate: () => void;
};

function getClient() {
  return createApiClient({
    backendUrl: MOBILE_API_BASE_URL,
    getAuthSession: async () => useAuthStore.getState().session,
    onAuthSession: async (session) => {
      useAuthStore.getState().setSession(session);
    }
  });
}

export const useContractStore = create<ContractStore>((set) => ({
  contract: null,
  isLoading: false,
  error: undefined,
  cacheState: "missing",
  async fetchContract(contractId) {
    set({ isLoading: true, error: undefined });
    try {
      const response = await getClient().getContract(contractId);
      await writeCacheEntry(CACHE_KEYS.contract, response.contract);
      set({ contract: response.contract, isLoading: false, cacheState: "fresh" });
      return response.contract;
    } catch (error) {
      const cached = await readCacheEntry<GetContractResponse["contract"]>(CACHE_KEYS.contract);
      const cacheState = getCacheFreshness(cached?.cachedAt);
      set({
        contract: cacheState === "expired" ? null : cached?.data ?? null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch contract.",
        cacheState
      });
      return cacheState === "expired" ? null : cached?.data ?? null;
    }
  },
  invalidate() {
    set({ contract: null, error: undefined, cacheState: "missing" });
  }
}));
