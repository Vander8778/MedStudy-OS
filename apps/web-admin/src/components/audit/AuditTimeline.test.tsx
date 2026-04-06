import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuditTimeline } from "./AuditTimeline";

describe("audit timeline", () => {
  it("renders audit entries in order", () => {
    const markup = renderToStaticMarkup(
      <AuditTimeline
        entries={[
          {
            id: "event_1",
            title: "warning_raised",
            occurredAt: "2026-04-06T10:30:00.000Z",
            actorLabel: "system",
            notes: "Window focus changed",
            source: "session_event"
          }
        ]}
      />
    );

    expect(markup).toContain("warning_raised");
    expect(markup).toContain("Window focus changed");
  });
});
