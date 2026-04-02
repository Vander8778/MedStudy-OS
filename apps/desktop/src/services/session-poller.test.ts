import { describe, expect, it } from "vitest";
import {
  getSessionPollIntervalMs,
  shouldFetchReviewData,
  shouldPollSession
} from "./session-poller";

describe("session poller strategy", () => {
  it("uses faster cadence for warning and invalid states", () => {
    expect(getSessionPollIntervalMs("active_warning", 5_000)).toBe(2_000);
    expect(getSessionPollIntervalMs("invalid_block", 5_000)).toBe(2_000);
  });

  it("uses slower cadence for paused sessions", () => {
    expect(getSessionPollIntervalMs("paused_valid", 5_000)).toBe(10_000);
    expect(getSessionPollIntervalMs("paused_expired", 5_000)).toBe(10_000);
  });

  it("does not poll when there is no active session state to reconcile", () => {
    expect(shouldPollSession(undefined)).toBe(false);
    expect(shouldPollSession("planned")).toBe(false);
  });

  it("avoids repeated review-data fetches once review state is already hydrated", () => {
    expect(
      shouldFetchReviewData({
        previousState: "review_pending",
        nextState: "review_pending",
        hasScoring: true,
        hasEvents: true
      })
    ).toBe(false);
    expect(
      shouldFetchReviewData({
        previousState: "active_valid",
        nextState: "review_pending",
        hasScoring: false,
        hasEvents: false
      })
    ).toBe(true);
  });
});
