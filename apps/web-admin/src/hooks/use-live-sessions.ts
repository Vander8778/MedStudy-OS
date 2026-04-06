"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, type LiveSessionRow } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";

export function useLiveSessions() {
  const [data, setData] = useState<readonly LiveSessionRow[]>([]);
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
      const next = await client.listLiveSessions(session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load live sessions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
