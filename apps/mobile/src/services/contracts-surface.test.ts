import { describe, expect, it } from "vitest";
import {
  checkpointViewSchema,
  contractEvaluationSummaryViewSchema,
  getContractResponseSchema,
  getEventsResponseSchema,
  getScoringResponseSchema,
  getSessionResponseSchema,
  progressSummarySchema,
  requestReviewRequestSchema,
  reviewResultResponseSchema,
  scoringResultViewSchema,
  sessionActionRequestSchema,
  sessionAggregateResponseSchema,
  sessionGamificationReceiptSchema,
  submitArtifactRequestSchema,
  submitArtifactResponseSchema,
  vivaAttemptViewSchema
} from "@medstudy/contracts";

describe("contracts export surface used by mobile api client", () => {
  it("exposes the schema values imported by the mobile companion", () => {
    expect(checkpointViewSchema).toBeDefined();
    expect(contractEvaluationSummaryViewSchema).toBeDefined();
    expect(getContractResponseSchema).toBeDefined();
    expect(getEventsResponseSchema).toBeDefined();
    expect(getScoringResponseSchema).toBeDefined();
    expect(getSessionResponseSchema).toBeDefined();
    expect(progressSummarySchema).toBeDefined();
    expect(requestReviewRequestSchema).toBeDefined();
    expect(reviewResultResponseSchema).toBeDefined();
    expect(scoringResultViewSchema).toBeDefined();
    expect(sessionActionRequestSchema).toBeDefined();
    expect(sessionAggregateResponseSchema).toBeDefined();
    expect(sessionGamificationReceiptSchema).toBeDefined();
    expect(submitArtifactRequestSchema).toBeDefined();
    expect(submitArtifactResponseSchema).toBeDefined();
    expect(vivaAttemptViewSchema).toBeDefined();
  });
});
