"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, PageHeader, Panel, StatusCallout } from "../../../components/common/AdminPrimitives";
import { useSessionsList } from "../../../hooks/use-sessions-list";

export default function SessionsPage() {
  const search = useSearchParams();
  const { data, isLoading, error } = useSessionsList(new URLSearchParams(search.toString()));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Sessions"
        subtitle="Filterable supervisory session list backed by backend-owned state."
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      <Panel title={isLoading ? "Loading sessions…" : "Session list"}>
        <DataTable
          headers={["Session", "Student", "State", "Valid Minutes", "Warnings", "Open"]}
          rows={(data?.sessions ?? []).map((session) => [
            session.session.title,
            session.session.userId,
            session.session.state,
            session.session.validMinutes,
            session.session.warningCount,
            <Link key={session.session.id} href={`/sessions/${session.session.id}`}>
              Inspect
            </Link>
          ])}
        />
      </Panel>
    </div>
  );
}
