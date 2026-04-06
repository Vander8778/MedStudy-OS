"use client";

import { use } from "react";
import { PageHeader, Panel, StatCard, StatGrid, StatusCallout } from "../../../../components/common/AdminPrimitives";
import { useStudentDetail } from "../../../../hooks/use-students";

export default function StudentDetailPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error } = useStudentDetail(resolvedParams.userId);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Student Detail"
        subtitle="Profile, contracts, session history, penalties, and limited progress context."
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      {data ? (
        <>
          <Panel title="Profile Summary">
            <StatGrid>
              <StatCard label="Email" value={data.user.email} />
              <StatCard label="Display Name" value={data.profile?.displayName ?? "—"} />
              <StatCard label="Study Stage" value={data.profile?.studyStage ?? "—"} />
              <StatCard label="Level" value={data.progress?.level.level ?? "—"} />
              <StatCard label="Streak" value={data.progress?.streak.currentLength ?? "—"} />
            </StatGrid>
          </Panel>
          <Panel title="Active Contracts">{data.activeContracts.length}</Panel>
          <Panel title="Session History">{data.sessionHistory.length}</Panel>
          <Panel title="Penalty History">{data.penalties.length}</Panel>
          <Panel title="Mastery Summary">
            <ul style={{ margin: 0 }}>
              {data.masterySummary.map((track) => (
                <li key={track.id}>
                  {track.label}: {track.percent}%
                </li>
              ))}
            </ul>
          </Panel>
        </>
      ) : (
        <Panel title={isLoading ? "Loading student detail…" : "Student detail unavailable"}>—</Panel>
      )}
    </div>
  );
}
