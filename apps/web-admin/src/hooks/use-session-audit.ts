"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, type SessionAuditEntry } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";

export function useSessionAudit(sessionId: string) {
  const [data, setData] = useState<{
    entries: readonly SessionAuditEntry[];
    dependencyWarnings: readonly string[];
  } | null>(null);
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
      const next = await client.getSessionAudit(sessionId, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load audit.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
