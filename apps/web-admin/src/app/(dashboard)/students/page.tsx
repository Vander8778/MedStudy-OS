"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, PageHeader, Panel, StatusCallout } from "../../../components/common/AdminPrimitives";
import { useStudents } from "../../../hooks/use-students";

export default function StudentsPage() {
  const search = useSearchParams();
  const { data, isLoading, error } = useStudents(new URLSearchParams(search.toString()));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Students"
        subtitle="Searchable student directory and quick supervisory context."
      />
      {error ? <StatusCallout tone="warning">{error}</StatusCallout> : null}
      <Panel title={isLoading ? "Loading students…" : "Student list"}>
        <DataTable
          headers={["Email", "Display name", "Stage", "Level", "Open"]}
          rows={data.map((student) => [
            student.user.email,
            student.profile?.displayName ?? "—",
            student.profile?.studyStage ?? "—",
            student.currentLevel ?? "—",
            <Link key={student.user.id} href={`/students/${student.user.id}`}>
              Open
            </Link>
          ])}
        />
      </Panel>
    </div>
  );
}
