"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, type SessionsListResponse } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";

export function useSessionsList(search: URLSearchParams) {
  const [data, setData] = useState<SessionsListResponse | null>(null);
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
      const next = await client.listSessions(search, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load sessions.");
    } finally {
      setIsLoading(false);
    }
  }, [search.toString()]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
