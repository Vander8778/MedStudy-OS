"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, type PenaltiesListResponse } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";

export function usePenalties(search: URLSearchParams) {
  const [data, setData] = useState<PenaltiesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    const session = readStoredAdminSession();
    if (!session) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const client = createApiClient();
      const next = await client.listPenalties(search, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load penalties.");
    } finally {
      setIsLoading(false);
    }
  }, [search.toString()]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutatePenalty = useCallback(
    async (penaltyId: string, action: "revoke" | "confirm", note: string) => {
      const session = readStoredAdminSession();
      if (!session) {
        throw new Error("Authentication required.");
      }

      const client = createApiClient();
      if (action === "revoke") {
        await client.revokePenalty(penaltyId, { note }, session);
      } else {
        await client.confirmPenalty(penaltyId, { note }, session);
      }

      await refresh();
    },
    [refresh]
  );

  return { data, isLoading, error, refresh, mutatePenalty };
}
