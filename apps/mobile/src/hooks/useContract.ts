import { useEffect } from "react";
import { useContractStore } from "../state/contract-store";

export function useContract(contractId?: string) {
  const store = useContractStore();

  useEffect(() => {
    if (contractId) {
      void store.fetchContract(contractId);
    }
  }, [contractId, store]);

  return store;
}
