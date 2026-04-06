"use client";

import { useCallback, useEffect, useState } from "react";
import type { GetContractResponse } from "@medstudy/contracts";
import { createApiClient, type ContractDraftInput, type ContractsListResponse } from "../lib/api-client";
import { readStoredAdminSession } from "../lib/auth";

export function useContracts(search: URLSearchParams) {
  const [data, setData] = useState<ContractsListResponse | null>(null);
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
      const next = await client.listContracts(search, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load contracts.");
    } finally {
      setIsLoading(false);
    }
  }, [search.toString()]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}

export function useContractDetail(contractId: string) {
  const [data, setData] = useState<GetContractResponse | null>(null);
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
      const next = await client.getContract(contractId, session);
      setData(next);
      setError(undefined);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load contract.");
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createOrUpdate = useCallback(
    async (draft: ContractDraftInput, mode: "create" | "update") => {
      const session = readStoredAdminSession();
      if (!session) {
        throw new Error("Authentication required.");
      }

      const client = createApiClient();
      if (mode === "create") {
        await client.createContract(draft, session);
      } else {
        await client.updateContract(contractId, draft, session);
      }
      await refresh();
    },
    [contractId, refresh]
  );

  return { data, isLoading, error, refresh, createOrUpdate };
}
