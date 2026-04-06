"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, Panel, StatusCallout } from "../../../components/common/AdminPrimitives";
import { PenaltyActionPanel, PenaltyQueueTable } from "../../../components/penalty/PenaltyViews";
import { usePenalties } from "../../../hooks/use-penalties";
import { getPenaltyActionKey } from "../../../lib/admin-page-state";

export default function PenaltiesPage() {
  const search = useSearchParams();
  const searchKey = search.toString();
  const { data, isLoading, error, mutatePenalty } = usePenalties(new URLSearchParams(searchKey));
  const [notesByAction, setNotesByAction] = useState<Record<string, string>>({});
  const [mutationError, setMutationError] = useState<string>();

  async function handlePenaltyAction(penaltyId: string, action: "revoke" | "confirm") {
    const actionKey = getPenaltyActionKey(penaltyId, action);
    const note = notesByAction[actionKey] ?? "";

    try {
      setMutationError(undefined);
      await mutatePenalty(penaltyId, action, note);
      setNotesByAction((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    } catch (nextError) {
      setMutationError(nextError instanceof Error ? nextError.message : "Penalty action failed.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Penalties"
        subtitle="Review queue for penalty confirmation and revocation flows."
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      {mutationError ? <StatusCallout tone="error">{mutationError}</StatusCallout> : null}
      <Panel title={isLoading ? "Loading penalties..." : "Penalty queue"}>
        <PenaltyQueueTable penalties={data?.penalties ?? []} />
      </Panel>
      <Panel title="Penalty actions">
        <PenaltyActionPanel
          penalties={data?.penalties ?? []}
          getNote={(penaltyId, action) =>
            notesByAction[getPenaltyActionKey(penaltyId, action)] ?? ""
          }
          onNoteChange={(penaltyId, action, value) =>
            setNotesByAction((current) => ({
              ...current,
              [getPenaltyActionKey(penaltyId, action)]: value
            }))
          }
          onAction={handlePenaltyAction}
        />
      </Panel>
    </div>
  );
}
