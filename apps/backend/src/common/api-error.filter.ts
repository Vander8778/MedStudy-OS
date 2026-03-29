import { Catch, type ArgumentsHost, type ExceptionFilter, HttpException } from "@nestjs/common";
import type { ApiErrorResponse } from "@medstudy/contracts";
import {
  ApiException,
  isUnauthorizedException
} from "./exceptions";

type HttpResponseLike = {
  status: (code: number) => HttpResponseLike;
  json: (body: ApiErrorResponse) => void;
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<HttpResponseLike>();
    const { status, body } = this.normalize(exception);

    response.status(status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details
          }
        }
      };
    }

    if (isUnauthorizedException(exception)) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: "auth.unauthorized",
            message: exception.message
          }
        }
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === "string"
          ? response
          : typeof response === "object" &&
              response !== null &&
              "message" in response &&
              typeof response.message === "string"
            ? response.message
            : "Request failed.";
      const details =
        typeof response === "object" && response !== null && !Array.isArray(response)
          ? ("details" in response &&
              typeof response.details === "object" &&
              response.details !== null
                ? (response.details as Record<string, unknown>)
                : undefined)
          : undefined;

      return {
        status: exception.getStatus(),
        body: {
          error: {
            code:
              exception.getStatus() === 422
                ? "validation.invalid_input"
                : exception.getStatus() === 401
                  ? "auth.unauthorized"
                  : "internal.unknown",
            message,
            details
          }
        }
      };
    }

    return {
      status: 500,
      body: {
        error: {
          code: "internal.unknown",
          message: "An unexpected error occurred."
        }
      }
    };
  }
}
