import { ConsoleLogger, Injectable } from "@nestjs/common";
import { getEnv } from "../config/env";
import { RequestContextStore } from "./request-context";

function normalizeMessage(message: unknown) {
  if (typeof message === "string") {
    return { message };
  }

  if (message && typeof message === "object" && !Array.isArray(message)) {
    return message as Record<string, unknown>;
  }

  return { message: String(message) };
}

@Injectable()
export class JsonLogger extends ConsoleLogger {
  private write(level: "debug" | "info" | "warn" | "error", message: unknown, context?: string, trace?: string) {
    const env = getEnv();
    const requestContext = RequestContextStore.get();
    const payload = normalizeMessage(message);
    const record = {
      timestamp: new Date().toISOString(),
      level,
      service: env.serviceName,
      requestId: requestContext?.requestId,
      sessionId:
        requestContext?.sessionId ??
        (typeof payload.sessionId === "string" ? payload.sessionId : undefined),
      userId:
        requestContext?.userId ??
        (typeof payload.userId === "string" ? payload.userId : undefined),
      context,
      ...payload,
      ...(trace ? { trace } : {})
    };

    const serialized = `${JSON.stringify(record)}\n`;
    if (level === "error") {
      process.stderr.write(serialized);
      return;
    }

    process.stdout.write(serialized);
  }

  override log(message: unknown, context?: string) {
    this.write("info", message, context);
  }

  override warn(message: unknown, context?: string) {
    this.write("warn", message, context);
  }

  override error(message: unknown, trace?: string, context?: string) {
    this.write("error", message, context, trace);
  }

  override debug(message: unknown, context?: string) {
    this.write("debug", message, context);
  }

  override verbose(message: unknown, context?: string) {
    this.write("debug", message, context);
  }
}
