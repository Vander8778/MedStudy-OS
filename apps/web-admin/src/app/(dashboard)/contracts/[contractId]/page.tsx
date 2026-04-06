"use client";

import { use, useEffect, useState } from "react";
import { ContractDetailPanel, ContractForm } from "../../../../components/contract/ContractViews";
import { PageHeader, Panel, StatusCallout } from "../../../../components/common/AdminPrimitives";
import { useContractDetail } from "../../../../hooks/use-contracts";
import type { ContractDraftInput } from "../../../../lib/api-client";

export default function ContractDetailPage({
  params
}: {
  params: Promise<{ contractId: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error, createOrUpdate } = useContractDetail(
    resolvedParams.contractId
  );
  const [mutationError, setMutationError] = useState<string>();
  const [draft, setDraft] = useState<ContractDraftInput | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    setDraft({
      userId: data.contract.userId,
      name: data.contract.name,
      description: data.contract.description,
      tags: [...data.contract.tags],
      status: data.contract.status,
      activeRange: data.contract.activeRange,
      terms: data.contract.terms
    });
  }, [data]);

  const readOnly = data ? !["draft", "pending"].includes(data.contract.status) : true;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader title="Contract Detail" subtitle="Read-only by default unless the backend allows editing." />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      {mutationError ? <StatusCallout tone="error">{mutationError}</StatusCallout> : null}
      {data ? <ContractDetailPanel contract={data.contract} /> : null}
      <Panel title={isLoading ? "Loading contract…" : "Edit contract"}>
        {draft ? (
          <ContractForm
            draft={draft}
            submitLabel="Save contract"
            readOnly={readOnly}
            backendNotice={
              readOnly
                ? "Editing is disabled because this contract is not in a backend-editable state."
                : undefined
            }
            onChange={setDraft}
            onSubmit={() =>
              void createOrUpdate(draft, "update").catch((nextError) =>
                setMutationError(nextError instanceof Error ? nextError.message : "Update failed.")
              )
            }
          />
        ) : (
          "Contract detail unavailable."
        )}
      </Panel>
    </div>
  );
}
