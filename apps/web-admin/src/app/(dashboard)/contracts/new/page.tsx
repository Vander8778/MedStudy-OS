"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, Panel, StatusCallout } from "../../../../components/common/AdminPrimitives";
import { ContractForm } from "../../../../components/contract/ContractViews";
import { createApiClient, type ContractDraftInput } from "../../../../lib/api-client";
import { readStoredAdminSession } from "../../../../lib/auth";

const defaultDraft: ContractDraftInput = {
  userId: "",
  name: "",
  description: "",
  tags: [],
  activeRange: {
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  terms: {
    minValidMinutes: 45,
    maxMissedCheckpoints: 1,
    mandatoryArtifactTypes: ["final_submission"],
    vivaPassingScore: 70
  }
};

export default function NewContractPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(defaultDraft);
  const [error, setError] = useState<string>();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader title="New Contract" subtitle="Create contracts through the backend API only." />
      {error ? <StatusCallout tone="error">{error}</StatusCallout> : null}
      <Panel title="Contract form">
        <ContractForm
          draft={draft}
          submitLabel="Create contract"
          onChange={setDraft}
          onSubmit={() =>
            void (async () => {
              try {
                const session = readStoredAdminSession();
                if (!session) {
                  throw new Error("Authentication required.");
                }

                await createApiClient().createContract(draft, session);
                router.replace("/contracts");
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : "Create failed.");
              }
            })()
          }
        />
      </Panel>
    </div>
  );
}
