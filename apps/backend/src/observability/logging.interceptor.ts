import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import { finalize } from "rxjs/operators";
import type { Observable } from "rxjs";
import { RequestContextStore } from "./request-context";
import { recordHttpRequestMetric } from "./metrics.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      route?: { path?: string };
      baseUrl?: string;
    }>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const durationSeconds = Math.max((performance.now() - startedAt) / 1000, 0);
        const route =
          (request.baseUrl ?? "") + (request.route?.path ?? request.originalUrl ?? "unknown");

        recordHttpRequestMetric({
          method: request.method,
          route,
          status: response.statusCode,
          durationSeconds
        });

        this.logger.log({
          message: "http_request_completed",
          method: request.method,
          route,
          status: response.statusCode,
          durationMs: Math.round(durationSeconds * 1000),
          requestId: RequestContextStore.get()?.requestId
        });
      })
    );
  }
}
