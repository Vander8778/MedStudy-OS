"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, Panel, StatusCallout } from "../../../components/common/AdminPrimitives";
import { PenaltyActionPanel, PenaltyQueueTable } from "../../../components/penalty/PenaltyViews";
import { usePenalties } from "../../../hooks/use-penalties";

export default function PenaltiesPage() {
  const search = useSearchParams();
  const searchKey = search.toString();
  const { data, isLoading, error, mutatePenalty } = usePenalties(new URLSearchParams(searchKey));
  const [note, setNote] = useState("");
  const [mutationError, setMutationError] = useState<string>();

  async function handlePenaltyAction(penaltyId: string, action: "revoke" | "confirm") {
    try {
      setMutationError(undefined);
      await mutatePenalty(penaltyId, action, note);
      setNote("");
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
          note={note}
          onNoteChange={setNote}
          onAction={handlePenaltyAction}
        />
      </Panel>
    </div>
  );
}
