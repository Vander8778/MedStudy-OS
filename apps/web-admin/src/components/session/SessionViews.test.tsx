import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfirmActionDialog } from "../common/AdminPrimitives";
import { LiveSessionsTable, SessionDetailViewPanel } from "./SessionViews";

const detail = {
  aggregate: {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Cardiology Focus",
      objective: "Review rhythm strips",
      state: "failed" as const,
      plannedRange: {
        startsAt: "2026-04-06T10:00:00.000Z",
        endsAt: "2026-04-06T11:00:00.000Z"
      },
      validMinutes: 25,
      invalidMinutes: 20,
      warningCount: 2,
      missedCheckpointCount: 1,
      finalArtifactRequired: true,
      createdAt: "2026-04-06T09:00:00.000Z",
      updatedAt: "2026-04-06T11:00:00.000Z"
    },
    contract: {
      id: "contract_1",
      userId: "user_1",
      name: "Core Contract",
      status: "active" as const,
      terms: {
        minValidMinutes: 45,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70
      },
      activeRange: {
        startsAt: "2026-04-01T00:00:00.000Z",
        endsAt: "2026-05-01T00:00:00.000Z"
      },
      tags: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z"
    },
    checkpoints: [],
    artifacts: [],
    vivaAttempts: [],
    blocks: [],
    penalties: []
  },
  scoring: {
    outcome: "failed" as const,
    sessionScore: 51,
    components: {
      validTime: { raw: 40, weight: 0.35, weighted: 14 },
      process: { raw: 50, weight: 0.25, weighted: 12.5 },
      artifact: { raw: 60, weight: 0.2, weighted: 12 },
      knowledge: { raw: 62, weight: 0.2, weighted: 12.4 }
    },
    hardFailTriggered: false,
    hardFailReasons: [],
    decisionTrace: {
      decidedByHardFail: false,
      scoreThresholdApplied: {
        min: 70,
        max: 100,
        outcome: "failed" as const
      }
    }
  },
  contractEvaluation: null,
  antiAvoidance: {
    summary: "Unavailable",
    signals: [],
    source: "unavailable" as const
  },
  timeline: [],
  auditEntries: [],
  availableAdminActions: [],
  dependencyWarnings: ["Audit fallback"]
} as const;

describe("session explainability views", () => {
  it("renders the key session detail sections", () => {
    const markup = renderToStaticMarkup(<SessionDetailViewPanel detail={detail} />);

    expect(markup).toContain("Score Breakdown");
    expect(markup).toContain("Contract Evaluation");
    expect(markup).toContain("Anti-Avoidance");
    expect(markup).toContain("Admin Actions Panel");
  });

  it("requires notes for destructive confirmations", () => {
    const markup = renderToStaticMarkup(
      <ConfirmActionDialog
        title="Penalize Session"
        noteLabel="Admin note"
        note=""
        requiresNote
        onNoteChange={() => {}}
        onConfirm={() => {}}
        confirmLabel="Penalize"
      />
    );

    expect(markup).toContain("disabled");
  });

  it("renders the live monitor table", () => {
    const markup = renderToStaticMarkup(
      <LiveSessionsTable
        rows={[
          {
            sessionId: "session_1",
            studentLabel: "Ada Lovelace",
            title: "Cardiology Focus",
            state: "active_warning",
            validMinutes: 24,
            warningCount: 2,
            missedCheckpointCount: 1,
            lastHeartbeatAgeSeconds: 18
          }
        ]}
      />
    );

    expect(markup).toContain("Ada Lovelace");
    expect(markup).toContain("Cardiology Focus");
    expect(markup).toContain("18s ago");
  });
});
