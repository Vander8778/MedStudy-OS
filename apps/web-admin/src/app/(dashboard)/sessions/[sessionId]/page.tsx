"use client";

import { use, useState } from "react";
import { PageHeader, StatusCallout } from "../../../../components/common/AdminPrimitives";
import { AdminActionPanel, SessionDetailViewPanel } from "../../../../components/session/SessionViews";
import { useSessionDetail } from "../../../../hooks/use-session-detail";
import type { AdminActionId } from "../../../../lib/permissions";

export default function SessionDetailPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error, runAdminAction } = useSessionDetail(
    resolvedParams.sessionId
  );
  const [note, setNote] = useState("");
  const [mutationError, setMutationError] = useState<string>();

  async function handleAction(actionId: AdminActionId) {
    if (actionId === "revoke_penalty" || actionId === "confirm_penalty") {
      return;
    }

    try {
      setMutationError(undefined);
      await runAdminAction(actionId, note);
      setNote("");
    } catch (nextError) {
      setMutationError(nextError instanceof Error ? nextError.message : "Action failed.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Session Detail"
        subtitle="Explainability-first session review. Backend truth only."
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      {mutationError ? <StatusCallout tone="error">{mutationError}</StatusCallout> : null}
      {data ? (
        <SessionDetailViewPanel
          detail={data}
          adminActionUi={
            <AdminActionPanel
              actions={data.availableAdminActions}
              activeNote={note}
              onNoteChange={setNote}
              onConfirm={handleAction}
            />
          }
        />
      ) : (
        <StatusCallout tone="info">
          {isLoading ? "Loading session detail…" : "Session detail unavailable."}
        </StatusCallout>
      )}
    </div>
  );
}
