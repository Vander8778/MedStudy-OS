"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, Panel, StatusCallout } from "../../../components/common/AdminPrimitives";
import { ContractListTable } from "../../../components/contract/ContractViews";
import { useContracts } from "../../../hooks/use-contracts";

export default function ContractsPage() {
  const search = useSearchParams();
  const { data, isLoading, error } = useContracts(new URLSearchParams(search.toString()));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Contracts"
        subtitle="List, inspect, and create backend-authorized contracts."
        actions={<Link href="/contracts/new">New contract</Link>}
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      <Panel title={isLoading ? "Loading contracts…" : "Contract list"}>
        <ContractListTable contracts={data?.contracts ?? []} />
      </Panel>
    </div>
  );
}
