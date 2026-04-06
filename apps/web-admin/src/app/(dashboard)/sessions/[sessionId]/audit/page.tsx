"use client";

import { use } from "react";
import { PageHeader, StatusCallout } from "../../../../../components/common/AdminPrimitives";
import { AuditTimeline } from "../../../../../components/audit/AuditTimeline";
import { useSessionAudit } from "../../../../../hooks/use-session-audit";

export default function SessionAuditPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error } = useSessionAudit(resolvedParams.sessionId);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader title="Session Audit" subtitle="Focused audit timeline for administrative review." />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      <AuditTimeline
        entries={data?.entries ?? []}
        dependencyWarnings={
          data?.dependencyWarnings ??
          (isLoading ? ["Loading audit timeline…"] : [])
        }
      />
    </div>
  );
}
