"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, type SessionDetailView } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";
import type { AdminActionId } from "../lib/permissions";

export async function executeSessionMutationAndRefresh(options: {
  mutate: () => Promise<unknown>;
  refresh: () => Promise<unknown>;
}) {
  await options.mutate();
  await options.refresh();
}

export function useSessionDetail(sessionId: string) {
  const [data, setData] = useState<SessionDetailView | null>(null);
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
      const next = await client.getSessionDetail(sessionId, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load session detail.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAdminAction = useCallback(
    async (action: AdminActionId, note: string) => {
      const session = readStoredAdminSession();
      if (!session) {
        throw new Error("Authentication required.");
      }

      const client = createApiClient();
      await executeSessionMutationAndRefresh({
        mutate: async () => {
          if (action === "excuse") {
            await client.excuseSession(sessionId, { note }, session);
            return;
          }

          if (action === "penalize") {
            await client.penalizeSession(sessionId, { note }, session);
            return;
          }

          if (action === "force_review") {
            await client.forceReviewSession(sessionId, session);
            return;
          }

          await client.overrideSessionOutcome(
            sessionId,
            { note, outcome: "review_pending" },
            session
          );
        },
        refresh
      });
    },
    [refresh, sessionId]
  );

  return { data, isLoading, error, refresh, runAdminAction };
}
