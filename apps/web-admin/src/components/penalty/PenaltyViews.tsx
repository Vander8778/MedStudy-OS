"use client";

import type { PenaltyView } from "@medstudy/contracts";
import { ConfirmActionDialog, DataTable, EmptyState } from "../common/AdminPrimitives";

export function PenaltyQueueTable({ penalties }: { penalties: readonly PenaltyView[] }) {
  if (!penalties.length) {
    return (
      <EmptyState
        title="No penalties"
        description="When the backend penalty queue is available, penalties will appear here."
      />
    );
  }

  return (
    <DataTable
      headers={["Student", "Type", "Reason", "Status", "Issued", "Resolved"]}
      rows={penalties.map((penalty) => [
        penalty.userId,
        penalty.type,
        penalty.reason,
        penalty.status,
        penalty.issuedAt,
        penalty.resolvedAt ?? "--"
      ])}
    />
  );
}

export function PenaltyActionPanel({
  penalties,
  note,
  onNoteChange,
  onAction
}: {
  penalties: readonly PenaltyView[];
  note: string;
  onNoteChange: (value: string) => void;
  onAction: (penaltyId: string, action: "revoke" | "confirm") => void;
}) {
  const actionable = penalties.filter(
    (penalty) => penalty.status === "pending" || penalty.status === "active"
  );

  if (!actionable.length) {
    return (
      <EmptyState
        title="No pending penalty actions"
        description="Only pending or active penalties can be confirmed or revoked from this dashboard."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {actionable.map((penalty) => (
        <div
          key={penalty.id}
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            borderRadius: 16,
            border: "1px solid #dbe4f0",
            background: "#f8fafc"
          }}
        >
          <div>
            <strong>{penalty.type}</strong>
            <div style={{ color: "#475569", marginTop: 4 }}>
              {penalty.userId} - {penalty.reason}
            </div>
          </div>
          {penalty.status === "pending" ? (
            <ConfirmActionDialog
              title="Confirm penalty"
              noteLabel="Review note"
              note={note}
              requiresNote={true}
              onNoteChange={onNoteChange}
              onConfirm={() => onAction(penalty.id, "confirm")}
              confirmLabel="Confirm penalty"
            />
          ) : null}
          <ConfirmActionDialog
            title="Revoke penalty"
            noteLabel="Revocation note"
            note={note}
            requiresNote={true}
            onNoteChange={onNoteChange}
            onConfirm={() => onAction(penalty.id, "revoke")}
            confirmLabel="Revoke penalty"
          />
        </div>
      ))}
    </div>
  );
}
