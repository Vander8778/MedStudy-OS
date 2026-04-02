import {
  createSessionRequestSchema,
  getEventsResponseSchema,
  getScoringResponseSchema,
  getSessionResponseSchema,
  requestReviewRequestSchema,
  resumeSessionRequestSchema,
  reviewResultResponseSchema,
  sessionActionRequestSchema,
  sessionMutationResponseSchema,
  submitArtifactRequestSchema,
  submitArtifactResponseSchema,
  type CreateSessionRequest,
  type GetEventsResponse,
  type GetScoringResponse,
  type GetSessionResponse,
  type RequestReviewRequest,
  type ResumeSessionRequest,
  type ReviewResultResponse,
  type SessionActionRequest,
  type SessionMutationResponse,
  type SubmitArtifactRequest,
  type SubmitArtifactResponse
} from "@medstudy/contracts";
import type { AuthSession, AuthUser } from "../types";

type ApiClientOptions = {
  backendUrl: string;
  token?: string;
};

async function requestJson<TResponse>(
  input: RequestInfo | URL,
  init: RequestInit,
  parser: { parse: (value: unknown) => TResponse }
): Promise<TResponse> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return parser.parse(await response.json());
}

export function createApiClient(options: ApiClientOptions) {
  const baseHeaders = {
    "Content-Type": "application/json",
    ...(options.token
      ? {
          Authorization: `Bearer ${options.token}`
        }
      : {})
  };
  const baseUrl = options.backendUrl.replace(/\/$/, "");

  return {
    async login(email: string): Promise<AuthSession> {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}.`);
      }

      return (await response.json()) as AuthSession;
    },
    async me(): Promise<AuthUser> {
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: "GET",
        headers: baseHeaders
      });

      if (!response.ok) {
        throw new Error(`Failed to load current user: ${response.status}.`);
      }

      return (await response.json()) as AuthUser;
    },
    async createSession(input: CreateSessionRequest) {
      const body = createSessionRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        getSessionResponseSchema
      );
    },
    async getSession(id: string): Promise<GetSessionResponse> {
      return requestJson(
        `${baseUrl}/sessions/${id}`,
        {
          method: "GET",
          headers: baseHeaders
        },
        getSessionResponseSchema
      );
    },
    async armSession(id: string, input: SessionActionRequest) {
      const body = sessionActionRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/arm`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        sessionMutationResponseSchema
      );
    },
    async confirmArmSession(id: string, input: SessionActionRequest) {
      const body = sessionActionRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/confirm-arm`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        sessionMutationResponseSchema
      );
    },
    async startSession(id: string, input: SessionActionRequest) {
      const body = sessionActionRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/start`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        sessionMutationResponseSchema
      );
    },
    async pauseSession(id: string, input: SessionActionRequest) {
      const body = sessionActionRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/pause`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        sessionMutationResponseSchema
      );
    },
    async resumeSession(id: string, input: ResumeSessionRequest) {
      const body = resumeSessionRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/resume`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        sessionMutationResponseSchema
      );
    },
    async submitArtifact(id: string, input: SubmitArtifactRequest) {
      const body = submitArtifactRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/submit-artifact`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        submitArtifactResponseSchema
      );
    },
    async requestReview(id: string, input: RequestReviewRequest) {
      const body = requestReviewRequestSchema.parse(input);
      return requestJson(
        `${baseUrl}/sessions/${id}/request-review`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify(body)
        },
        reviewResultResponseSchema
      );
    },
    async getScoring(id: string): Promise<GetScoringResponse> {
      return requestJson(
        `${baseUrl}/sessions/${id}/scoring`,
        {
          method: "GET",
          headers: baseHeaders
        },
        getScoringResponseSchema
      );
    },
    async getEvents(id: string): Promise<GetEventsResponse> {
      return requestJson(
        `${baseUrl}/sessions/${id}/events`,
        {
          method: "GET",
          headers: baseHeaders
        },
        getEventsResponseSchema
      );
    }
  };
}
