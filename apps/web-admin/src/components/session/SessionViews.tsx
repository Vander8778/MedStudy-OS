"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";
import type { GetSessionResponse } from "@medstudy/contracts";
import type { LiveSessionRow, SessionDetailView } from "../../lib/api-client";
import type { AdminActionId } from "../../lib/permissions";
import {
  ConfirmActionDialog,
  DataTable,
  EmptyState,
  Panel,
  StatCard,
  StatGrid,
  StatusCallout
} from "../common/AdminPrimitives";

export function SessionStateBadge({ state }: { state: string }) {
  const tone =
    state.includes("warning") || state.includes("failed")
      ? "#f59e0b"
      : state.includes("completed")
        ? "#10b981"
        : "#2563eb";

  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 999,
        padding: "4px 10px",
        background: `${tone}20`,
        color: tone,
        fontWeight: 700,
        textTransform: "uppercase",
        fontSize: 12
      }}
    >
      {state.replaceAll("_", " ")}
    </span>
  );
}

export function LiveSessionsTable({ rows }: { rows: readonly LiveSessionRow[] }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No live sessions"
        description="When the backend exposes active sessions here, they will appear in this monitor."
      />
    );
  }

  return (
    <DataTable
      headers={[
        "Student",
        "Session",
        "State",
        "Valid minutes",
        "Warnings",
        "Missed checkpoints",
        "Heartbeat",
        "Open"
      ]}
      rows={rows.map((row) => [
        row.studentLabel,
        row.title,
        <SessionStateBadge key={`${row.sessionId}-state`} state={row.state} />,
        row.validMinutes,
        row.warningCount,
        row.missedCheckpointCount,
        row.lastHeartbeatAgeSeconds
          ? `${row.lastHeartbeatAgeSeconds}s ago`
          : "Unavailable",
        <Link key={`${row.sessionId}-open`} href={`/sessions/${row.sessionId}`}>
          Inspect
        </Link>
      ])}
    />
  );
}

export function SessionSummaryStats({ session }: { session: GetSessionResponse["session"] }) {
  return (
    <StatGrid>
      <StatCard label="State" value={<SessionStateBadge state={session.state} />} />
      <StatCard label="Valid Minutes" value={session.validMinutes} />
      <StatCard label="Invalid Minutes" value={session.invalidMinutes} />
      <StatCard label="Warnings" value={session.warningCount} />
      <StatCard label="Missed Checkpoints" value={session.missedCheckpointCount} />
      <StatCard label="Review Requested" value={session.reviewRequestedAt ? "Yes" : "No"} />
    </StatGrid>
  );
}

export function ScoreBreakdown({ scoring }: { scoring: SessionDetailView["scoring"] }) {
  if (!scoring) {
    return (
      <StatusCallout tone="warning">
        Scoring has not been persisted for this session yet.
      </StatusCallout>
    );
  }

  return (
    <DataTable
      headers={["Component", "Raw", "Weight", "Weighted"]}
      rows={[
        [
          "Valid Time",
          scoring.components.validTime.raw ?? "n/a",
          scoring.components.validTime.weight,
          scoring.components.validTime.weighted
        ],
        [
          "Process",
          scoring.components.process.raw ?? "n/a",
          scoring.components.process.weight,
          scoring.components.process.weighted
        ],
        [
          "Artifact",
          scoring.components.artifact.raw ?? "n/a",
          scoring.components.artifact.weight,
          scoring.components.artifact.weighted
        ],
        [
          "Knowledge",
          scoring.components.knowledge.raw ?? "n/a",
          scoring.components.knowledge.weight,
          scoring.components.knowledge.weighted
        ]
      ]}
    />
  );
}

export function SessionDetailViewPanel({
  detail,
  adminActionUi
}: {
  detail: SessionDetailView;
  adminActionUi?: ReactNode;
}) {
  const { aggregate } = detail;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {detail.dependencyWarnings.map((warning) => (
        <StatusCallout key={warning} tone="warning">
          {warning}
        </StatusCallout>
      ))}

      <Panel title="Header">
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{aggregate.session.title}</h2>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>{aggregate.session.objective}</p>
          </div>
          <SessionSummaryStats session={aggregate.session} />
        </div>
      </Panel>

      <Panel title="Score Breakdown">
        <ScoreBreakdown scoring={detail.scoring} />
      </Panel>

      <Panel title="Contract Evaluation">
        {detail.contractEvaluation ? (
          <DataTable
            headers={["Rule group", "Result"]}
            rows={[
              ["All rules passed", detail.contractEvaluation.allRulesPassed ? "Yes" : "No"],
              [
                "Critical violation",
                detail.contractEvaluation.hasCriticalViolation ? "Yes" : "No"
              ],
              [
                "Critical codes",
                detail.contractEvaluation.criticalViolationCodes.join(", ") || "None"
              ],
              ["Warnings", detail.contractEvaluation.warningCodes.join(", ") || "None"]
            ]}
          />
        ) : (
          <StatusCallout tone="warning">
            Backend contract-evaluation detail endpoint is not available yet for the admin dashboard.
          </StatusCallout>
        )}
      </Panel>

      <Panel title="Anti-Avoidance">
        <p style={{ marginTop: 0 }}>{detail.antiAvoidance.summary}</p>
        <ul style={{ marginBottom: 0 }}>
          {detail.antiAvoidance.signals.length ? (
            detail.antiAvoidance.signals.map((signal) => <li key={signal}>{signal}</li>)
          ) : (
            <li>No backend anti-avoidance signals were returned.</li>
          )}
        </ul>
      </Panel>

      <Panel title="Timeline / Session Events">
        <DataTable
          headers={["When", "Type", "Actor", "Notes"]}
          rows={detail.timeline.map((event) => [
            event.occurredAt,
            event.type,
            event.actor.label ?? event.actor.userId ?? event.actor.actorType,
            event.state ? `State: ${event.state}` : "—"
          ])}
        />
      </Panel>

      <Panel title="Blocks View">
        {aggregate.blocks.length ? (
          <DataTable
            headers={["Type", "Range", "Credited Minutes", "Notes"]}
            rows={aggregate.blocks.map((block) => [
              block.type,
              `${block.range.startsAt} → ${block.range.endsAt}`,
              block.creditedMinutes,
              block.notes ?? "—"
            ])}
          />
        ) : (
          <EmptyState title="No blocks" description="The backend did not record any blocked ranges." />
        )}
      </Panel>

      <Panel title="Checkpoints Table">
        <DataTable
          headers={["Order", "Title", "Status", "Due", "Completed"]}
          rows={aggregate.checkpoints.map((checkpoint) => [
            checkpoint.order,
            checkpoint.title,
            checkpoint.status,
            checkpoint.dueAt,
            checkpoint.completedAt ?? "—"
          ])}
        />
      </Panel>

      <Panel title="Artifacts List">
        {aggregate.artifacts.length ? (
          <DataTable
            headers={["Title", "Type", "Status", "Source", "Submitted"]}
            rows={aggregate.artifacts.map((artifact) => [
              artifact.title,
              artifact.type,
              artifact.status,
              artifact.source,
              artifact.submittedAt ?? "—"
            ])}
          />
        ) : (
          <EmptyState title="No artifacts" description="No backend artifacts are attached to this session yet." />
        )}
      </Panel>

      <Panel title="Evaluations List">
        <StatusCallout tone="info">
          Detailed evaluation list endpoint is not wired yet. Scoring and viva attempts are shown below from backend-owned outputs.
        </StatusCallout>
      </Panel>

      <Panel title="Viva Attempts">
        {aggregate.vivaAttempts.length ? (
          <DataTable
            headers={["Status", "Scheduled", "Completed", "Score", "Notes"]}
            rows={aggregate.vivaAttempts.map((attempt) => [
              attempt.status,
              attempt.scheduledAt ?? "—",
              attempt.completedAt ?? "—",
              attempt.score ?? "—",
              attempt.notes ?? "—"
            ])}
          />
        ) : (
          <EmptyState title="No viva attempts" description="No viva attempts were returned for this session." />
        )}
      </Panel>

      <Panel title="Penalties">
        {aggregate.penalties.length ? (
          <DataTable
            headers={["Type", "Reason", "Status", "Issued", "Resolved"]}
            rows={aggregate.penalties.map((penalty) => [
              penalty.type,
              penalty.reason,
              penalty.status,
              penalty.issuedAt,
              penalty.resolvedAt ?? "—"
            ])}
          />
        ) : (
          <EmptyState title="No penalties" description="No penalties were attached to this session." />
        )}
      </Panel>

      <Panel title="Admin Actions Panel">{adminActionUi ?? "No actions available."}</Panel>
    </div>
  );
}

export function AdminActionPanel({
  actions,
  getNote,
  onNoteChange,
  onConfirm
}: {
  actions: SessionDetailView["availableAdminActions"];
  getNote: (actionId: AdminActionId) => string;
  onNoteChange: (actionId: AdminActionId, value: string) => void;
  onConfirm: (actionId: AdminActionId, note: string) => void;
}) {
  if (!actions.length) {
    return (
      <EmptyState
        title="No admin actions"
        description="The current role and backend state do not expose any conservative admin actions."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {actions.map((action) => (
        <ConfirmActionDialog
          key={action.id}
          title={action.label}
          noteLabel="Admin note"
          note={getNote(action.id)}
          requiresNote={action.requiresNote}
          onNoteChange={(value) => onNoteChange(action.id, value)}
          onConfirm={() => onConfirm(action.id, getNote(action.id))}
          confirmLabel={action.label}
        />
      ))}
    </div>
  );
}
