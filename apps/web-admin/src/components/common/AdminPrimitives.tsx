"use client";

import React, { type ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30 }}>{title}</h1>
        {subtitle ? <p style={{ margin: "6px 0 0", color: "#475569" }}>{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  tone = "default"
}: {
  title?: string;
  children: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${tone === "warning" ? "#f59e0b" : "#dbe4f0"}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
      }}
    >
      {title ? <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>{title}</h2> : null}
      {children}
    </section>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 14,
        padding: 14,
        border: "1px solid #e2e8f0"
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 700, fontSize: 22 }}>{value}</div>
    </div>
  );
}

export function StatusCallout({
  tone,
  children
}: {
  tone: "info" | "warning" | "error";
  children: ReactNode;
}) {
  const background =
    tone === "info" ? "#eff6ff" : tone === "warning" ? "#fffbeb" : "#fef2f2";
  const border = tone === "info" ? "#93c5fd" : tone === "warning" ? "#fcd34d" : "#fca5a5";

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background,
        border: `1px solid ${border}`,
        color: "#334155"
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: 16,
        padding: 24,
        color: "#475569"
      }}
    >
      <strong>{title}</strong>
      <p style={{ marginBottom: 0 }}>{description}</p>
    </div>
  );
}

export function DataTable({
  headers,
  rows
}: {
  headers: readonly string[];
  rows: readonly ReactNode[][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  textAlign: "left",
                  padding: "10px 8px",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 13
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: "12px 8px",
                    borderBottom: "1px solid #f1f5f9",
                    verticalAlign: "top"
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConfirmActionDialog({
  title,
  noteLabel,
  note,
  requiresNote,
  onNoteChange,
  onConfirm,
  confirmLabel
}: {
  title: string;
  noteLabel: string;
  note: string;
  requiresNote: boolean;
  onNoteChange: (value: string) => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  const disabled = requiresNote && !note.trim();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <strong>{title}</strong>
      <label style={{ display: "grid", gap: 6 }}>
        <span>{noteLabel}</span>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.currentTarget.value)}
          rows={4}
          style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: 12 }}
        />
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onConfirm}
        style={{
          borderRadius: 999,
          padding: "12px 16px",
          border: "none",
          background: disabled ? "#94a3b8" : "#0f172a",
          color: "#fff",
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer"
        }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}
