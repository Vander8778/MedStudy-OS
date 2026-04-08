import { randomUUID } from "node:crypto";
import { RequestContextStore } from "./request-context";

type RequestLike = {
  header: (name: string) => string | string[] | undefined;
};

type ResponseLike = {
  setHeader: (name: string, value: string) => unknown;
};

type NextFunctionLike = () => void;

export function requestContextMiddleware(
  request: RequestLike,
  response: ResponseLike,
  next: NextFunctionLike
) {
  const requestIdHeader = request.header("x-request-id");
  const requestId =
    typeof requestIdHeader === "string" && requestIdHeader.trim().length > 0
      ? requestIdHeader.trim()
      : randomUUID();

  response.setHeader("x-request-id", requestId);
  RequestContextStore.run({ requestId }, next);
}
