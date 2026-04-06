"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, type StudentDetailView, type StudentListItem } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";

export function useStudents(search: URLSearchParams) {
  const [data, setData] = useState<readonly StudentListItem[]>([]);
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
      const next = await client.listStudents(search, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, [search.toString()]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}

export function useStudentDetail(userId: string) {
  const [data, setData] = useState<StudentDetailView | null>(null);
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
      const next = await client.getStudentDetail(userId, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load student detail.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
