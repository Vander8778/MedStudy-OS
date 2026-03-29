import { HttpException, HttpStatus, UnauthorizedException } from "@nestjs/common";

export type ApiErrorCode =
  | "session.not_found"
  | "contract.not_found"
  | "session.invalid_transition"
  | "session.already_decided"
  | "session.review_in_progress"
  | "session.scoring_failed"
  | "contract.invalid_terms"
  | "validation.invalid_input"
  | "auth.unauthorized"
  | "internal.unknown";

export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message, status);
  }
}

export class SessionNotFoundException extends ApiException {
  constructor(sessionId: string) {
    super(
      HttpStatus.NOT_FOUND,
      "session.not_found",
      `Session ${sessionId} was not found.`,
      { sessionId }
    );
  }
}

export class ContractNotFoundException extends ApiException {
  constructor(contractId: string) {
    super(
      HttpStatus.NOT_FOUND,
      "contract.not_found",
      `Contract ${contractId} was not found.`,
      { contractId }
    );
  }
}

export class SessionConflictException extends ApiException {
  constructor(
    code: Extract<ApiErrorCode, "session.already_decided" | "session.review_in_progress">,
    message: string
  ) {
    super(HttpStatus.CONFLICT, code, message);
  }
}

export class SessionAlreadyDecidedException extends SessionConflictException {
  constructor(sessionId: string, state: string) {
    super(
      "session.already_decided",
      `Session ${sessionId} already has a decided outcome (${state}).`
    );
  }
}

export class SessionReviewInProgressException extends SessionConflictException {
  constructor(sessionId: string) {
    super(
      "session.review_in_progress",
      `Session ${sessionId} already has a review in progress.`
    );
  }
}

export class SessionInvalidTransitionException extends ApiException {
  constructor(reason: string, details?: Record<string, unknown>) {
    super(HttpStatus.CONFLICT, "session.invalid_transition", reason, details);
  }
}

export class SessionScoringFailedException extends ApiException {
  constructor(reason: string) {
    super(HttpStatus.CONFLICT, "session.scoring_failed", reason, { reason });
  }
}

export class ContractInvalidTermsException extends ApiException {
  constructor(issues: readonly unknown[]) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "contract.invalid_terms",
      "Contract terms are invalid.",
      { issues }
    );
  }
}

export class ValidationException extends ApiException {
  constructor(details?: Record<string, unknown>) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "validation.invalid_input",
      "Request validation failed.",
      details
    );
  }
}

export class AuthUnauthorizedApiException extends ApiException {
  constructor(message = "Authentication is required.") {
    super(HttpStatus.UNAUTHORIZED, "auth.unauthorized", message);
  }
}

export function isUnauthorizedException(error: unknown): error is UnauthorizedException {
  return error instanceof UnauthorizedException;
}
