import type { ArgumentsHost } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ApiErrorFilter } from "../api-error.filter";
import {
  ContractNotFoundException,
  ContractInvalidTermsException,
  SessionInvalidTransitionException,
  SessionAlreadyDecidedException,
  SessionNotFoundException,
  SessionReviewInProgressException,
  SessionScoringFailedException,
  ValidationException
} from "../exceptions";

function createHost() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response
    })
  } as ArgumentsHost;

  return { host, response };
}

describe("ApiErrorFilter", () => {
  it("maps session not found exceptions to the stable envelope", () => {
    const filter = new ApiErrorFilter();
    const { host, response } = createHost();

    filter.catch(new SessionNotFoundException("session_1"), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "session.not_found",
        message: "Session session_1 was not found.",
        details: { sessionId: "session_1" }
      }
    });
  });

  it("maps contract not found exceptions to the stable envelope", () => {
    const filter = new ApiErrorFilter();
    const { host, response } = createHost();

    filter.catch(new ContractNotFoundException("contract_1"), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "contract.not_found",
        message: "Contract contract_1 was not found.",
        details: { contractId: "contract_1" }
      }
    });
  });

  it("maps validation exceptions to 422 validation.invalid_input", () => {
    const filter = new ApiErrorFilter();
    const { host, response } = createHost();

    filter.catch(new ValidationException({ issues: [{ path: "title" }] }), host);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "validation.invalid_input",
        message: "Request validation failed.",
        details: { issues: [{ path: "title" }] }
      }
    });
  });

  it("maps session conflicts to the stable session code", () => {
    const filter = new ApiErrorFilter();
    const { host, response } = createHost();

    filter.catch(new SessionAlreadyDecidedException("session_1", "completed"), host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "session.already_decided",
        message: "Session session_1 already has a decided outcome (completed).",
        details: undefined
      }
    });
  });

  it("maps transition, review, and scoring exceptions to stable session codes", () => {
    const filter = new ApiErrorFilter();
    const invalidTransition = createHost();
    const reviewInProgress = createHost();
    const scoringFailed = createHost();

    filter.catch(
      new SessionInvalidTransitionException("Cannot transition from planned to completed."),
      invalidTransition.host
    );
    filter.catch(
      new SessionReviewInProgressException("session_1"),
      reviewInProgress.host
    );
    filter.catch(
      new SessionScoringFailedException("Scoring engine returned an invalid result."),
      scoringFailed.host
    );

    expect(invalidTransition.response.status).toHaveBeenCalledWith(409);
    expect(invalidTransition.response.json).toHaveBeenCalledWith({
      error: {
        code: "session.invalid_transition",
        message: "Cannot transition from planned to completed.",
        details: undefined
      }
    });
    expect(reviewInProgress.response.status).toHaveBeenCalledWith(409);
    expect(reviewInProgress.response.json).toHaveBeenCalledWith({
      error: {
        code: "session.review_in_progress",
        message: "Session session_1 already has a review in progress.",
        details: undefined
      }
    });
    expect(scoringFailed.response.status).toHaveBeenCalledWith(409);
    expect(scoringFailed.response.json).toHaveBeenCalledWith({
      error: {
        code: "session.scoring_failed",
        message: "Scoring engine returned an invalid result.",
        details: {
          reason: "Scoring engine returned an invalid result."
        }
      }
    });
  });

  it("maps contract validation failures and unauthorized errors", () => {
    const filter = new ApiErrorFilter();
    const contract = createHost();
    const auth = createHost();

    filter.catch(new ContractInvalidTermsException([{ field: "terms.minValidMinutes" }]), contract.host);
    filter.catch(new UnauthorizedException("No token"), auth.host);

    expect(contract.response.status).toHaveBeenCalledWith(422);
    expect(contract.response.json).toHaveBeenCalledWith({
      error: {
        code: "contract.invalid_terms",
        message: "Contract terms are invalid.",
        details: { issues: [{ field: "terms.minValidMinutes" }] }
      }
    });
    expect(auth.response.status).toHaveBeenCalledWith(401);
    expect(auth.response.json).toHaveBeenCalledWith({
      error: {
        code: "auth.unauthorized",
        message: "No token"
      }
    });
  });

  it("maps unknown errors to internal.unknown", () => {
    const filter = new ApiErrorFilter();
    const { host, response } = createHost();

    filter.catch(new Error("boom"), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "internal.unknown",
        message: "An unexpected error occurred."
      }
    });
  });
});
