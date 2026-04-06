import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PenaltyActionPanel } from "./PenaltyViews";

describe("penalty action panel", () => {
  it("renders independent note values per penalty action", () => {
    const markup = renderToStaticMarkup(
      <PenaltyActionPanel
        penalties={[
          {
            id: "penalty_1",
            sessionId: "session_1",
            userId: "user_1",
            contractId: "contract_1",
            type: "warning",
            reason: "missed_checkpoint",
            status: "pending",
            issuedAt: "2026-04-06T10:00:00.000Z",
            createdAt: "2026-04-06T10:00:00.000Z",
            updatedAt: "2026-04-06T10:00:00.000Z"
          },
          {
            id: "penalty_2",
            sessionId: "session_2",
            userId: "user_2",
            contractId: "contract_2",
            type: "strike",
            reason: "circumvention_attempt",
            status: "active",
            issuedAt: "2026-04-06T11:00:00.000Z",
            createdAt: "2026-04-06T11:00:00.000Z",
            updatedAt: "2026-04-06T11:00:00.000Z"
          }
        ]}
        getNote={(penaltyId, action) => `${penaltyId}-${action}-note`}
        onNoteChange={() => {}}
        onAction={() => {}}
      />
    );

    expect(markup).toContain("penalty_1-confirm-note");
    expect(markup).toContain("penalty_1-revoke-note");
    expect(markup).toContain("penalty_2-revoke-note");
  });
});
