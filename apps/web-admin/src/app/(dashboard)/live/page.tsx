"use client";

import { PageHeader, Panel, StatusCallout } from "../../../components/common/AdminPrimitives";
import { LiveSessionsTable } from "../../../components/session/SessionViews";
import { useLiveSessions } from "../../../hooks/use-live-sessions";

export default function LivePage() {
  const { data, isLoading, error } = useLiveSessions();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Live Monitor"
        subtitle="Polling every 30 seconds while the page is visible."
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      <Panel title={isLoading ? "Loading live sessions…" : "Active sessions"}>
        <LiveSessionsTable rows={data} />
      </Panel>
    </div>
  );
}
