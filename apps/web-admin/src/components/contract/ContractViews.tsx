"use client";

import React from "react";
import type { ContractSummaryView, ContractTerms } from "@medstudy/contracts";
import { validateContractDraft, type ContractDraftInput } from "../../lib/api-client";
import { DataTable, EmptyState, Panel, StatusCallout } from "../common/AdminPrimitives";

export function ContractListTable({ contracts }: { contracts: readonly ContractSummaryView[] }) {
  if (!contracts.length) {
    return (
      <EmptyState
        title="No contracts returned"
        description="When the backend admin contracts list endpoint is available, contracts will appear here."
      />
    );
  }

  return (
    <DataTable
      headers={["Name", "Status", "User", "Active Range", "Tags"]}
      rows={contracts.map((contract) => [
        contract.name,
        contract.status,
        contract.userId,
        `${contract.activeRange.startsAt} → ${contract.activeRange.endsAt}`,
        contract.tags.join(", ") || "—"
      ])}
    />
  );
}

export function ContractDetailPanel({ contract }: { contract: ContractSummaryView }) {
  return (
    <Panel title="Contract Detail">
      <DataTable
        headers={["Field", "Value"]}
        rows={[
          ["Name", contract.name],
          ["Status", contract.status],
          ["Description", contract.description ?? "—"],
          ["User", contract.userId],
          ["Active range", `${contract.activeRange.startsAt} → ${contract.activeRange.endsAt}`],
          ["Tags", contract.tags.join(", ") || "—"]
        ]}
      />
    </Panel>
  );
}

export function validateContractForm(input: ContractDraftInput) {
  return validateContractDraft(input);
}

export function ContractForm({
  draft,
  submitLabel,
  onChange,
  onSubmit,
  readOnly = false,
  backendNotice
}: {
  draft: ContractDraftInput;
  submitLabel: string;
  onChange: (draft: ContractDraftInput) => void;
  onSubmit: () => void;
  readOnly?: boolean;
  backendNotice?: string;
}) {
  const validation = validateContractForm(draft);

  function updateTerms(next: Partial<ContractTerms>) {
    onChange({
      ...draft,
      terms: {
        ...draft.terms,
        ...next
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {backendNotice ? <StatusCallout tone="warning">{backendNotice}</StatusCallout> : null}
      {!validation.valid ? (
        <StatusCallout tone="error">{validation.errors.join(" ")}</StatusCallout>
      ) : null}

      <label style={{ display: "grid", gap: 6 }}>
        <span>Contract name</span>
        <input
          disabled={readOnly}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.currentTarget.value })}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>User ID</span>
        <input
          disabled={readOnly}
          value={draft.userId}
          onChange={(event) => onChange({ ...draft, userId: event.currentTarget.value })}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Description</span>
        <textarea
          disabled={readOnly}
          value={draft.description ?? ""}
          rows={4}
          onChange={(event) => onChange({ ...draft, description: event.currentTarget.value })}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Min valid minutes</span>
          <input
            disabled={readOnly}
            type="number"
            value={draft.terms.minValidMinutes}
            onChange={(event) => updateTerms({ minValidMinutes: Number(event.currentTarget.value) })}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Viva passing score</span>
          <input
            disabled={readOnly}
            type="number"
            value={draft.terms.vivaPassingScore}
            onChange={(event) => updateTerms({ vivaPassingScore: Number(event.currentTarget.value) })}
          />
        </label>
      </div>

      <button
        type="button"
        disabled={readOnly || !validation.valid}
        onClick={onSubmit}
        style={{
          borderRadius: 999,
          border: "none",
          background: readOnly || !validation.valid ? "#94a3b8" : "#0f172a",
          color: "#fff",
          padding: "12px 16px",
          fontWeight: 700
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
