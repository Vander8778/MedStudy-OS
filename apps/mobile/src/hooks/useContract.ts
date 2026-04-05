import { useEffect } from "react";
import { useContractStore } from "../state/contract-store";

export function useContract(contractId?: string) {
  const contract = useContractStore((state) => state.contract);
  const isLoading = useContractStore((state) => state.isLoading);
  const error = useContractStore((state) => state.error);
  const cacheState = useContractStore((state) => state.cacheState);
  const fetchContract = useContractStore((state) => state.fetchContract);
  const invalidate = useContractStore((state) => state.invalidate);

  useEffect(() => {
    if (contractId) {
      void fetchContract(contractId);
    }
  }, [contractId, fetchContract]);

  return {
    contract,
    isLoading,
    error,
    cacheState,
    fetchContract,
    invalidate
  };
}
