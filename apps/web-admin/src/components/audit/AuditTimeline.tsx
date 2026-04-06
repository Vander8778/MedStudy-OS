"use client";

import React from "react";
import type { SessionAuditEntry } from "../../lib/api-client";
import { EmptyState, Panel } from "../common/AdminPrimitives";

export function AuditTimeline({
  entries,
  dependencyWarnings = []
}: {
  entries: readonly SessionAuditEntry[];
  dependencyWarnings?: readonly string[];
}) {
  return (
    <Panel title="Audit Timeline">
      {dependencyWarnings.length ? (
        <div style={{ marginBottom: 12, color: "#92400e" }}>{dependencyWarnings.join(" ")}</div>
      ) : null}
      {!entries.length ? (
        <EmptyState
          title="No audit entries"
          description="The backend did not return any audit records for this session."
        />
      ) : (
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 12 }}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <div style={{ fontWeight: 700 }}>{entry.title}</div>
              <div style={{ color: "#475569" }}>
                {entry.occurredAt} • {entry.actorLabel}
              </div>
              {entry.notes ? <div style={{ color: "#334155" }}>{entry.notes}</div> : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
