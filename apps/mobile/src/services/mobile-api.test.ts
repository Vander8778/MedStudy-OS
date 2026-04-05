import { describe, expect, it } from "vitest";
import { getMobileApiClient, parseQueuedArtifactActionPayload } from "./mobile-api";

describe("mobile api helpers", () => {
  it("reuses a singleton api client instance", () => {
    expect(getMobileApiClient()).toBe(getMobileApiClient());
  });

  it("validates queued artifact replay payloads", () => {
    expect(
      parseQueuedArtifactActionPayload({
        sessionId: "session_1",
        artifact: {
          type: "note",
          title: "Study note",
          source: "manual_entry",
          status: "submitted"
        }
      })
    ).toEqual({
      sessionId: "session_1",
      artifact: {
        type: "note",
        title: "Study note",
        source: "manual_entry",
        status: "submitted"
      }
    });

    expect(() =>
      parseQueuedArtifactActionPayload({
        sessionId: "session_1",
        artifact: {
          type: "note"
        }
      })
    ).toThrow("Queued artifact payload is invalid.");
  });
});
