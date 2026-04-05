import { z } from "zod";
import {
  avatarSchema,
  checkpointViewSchema,
  contractEvaluationSummaryViewSchema,
  getContractResponseSchema,
  getEventsResponseSchema,
  getScoringResponseSchema,
  getSessionResponseSchema,
  notificationSchema,
  profileSchema,
  progressSummarySchema,
  requestReviewRequestSchema,
  reviewResultResponseSchema,
  scoringResultViewSchema,
  sessionActionRequestSchema,
  sessionAggregateResponseSchema,
  sessionGamificationReceiptSchema,
  submitArtifactRequestSchema,
  submitArtifactResponseSchema,
  userSchema,
  vivaAttemptViewSchema,
  type GetContractResponse,
  type GetEventsResponse,
  type GetScoringResponse,
  type GetSessionResponse,
  type RequestReviewRequest,
  type ReviewResultResponse,
  type SessionActionRequest,
  type SubmitArtifactRequest,
  type SubmitArtifactResponse
} from "@medstudy/contracts";
import {
  clearStoredAuthSession,
  refreshSessionTokens,
  writeStoredAuthSession
} from "./auth-service";
import type {
  ArtifactSubmitPayload,
  AuthSession,
  AvatarCatalogResponse,
  HomeSummary,
  LoginResponse,
  MeResponse,
  NotificationsListResponse,
  ProgressResponse,
  ResultsListResponse,
  VivaAnswerRequest,
  VivaAnswerResponse,
  VivaSummary
} from "../types/app";

const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: userSchema,
  profile: profileSchema.optional()
});

const meResponseSchema = z.object({
  user: userSchema,
  profile: profileSchema.optional()
});

const currentSessionSummarySchema = z.object({
  activeSession: sessionAggregateResponseSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  plannedSession: sessionAggregateResponseSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  dueCheckpoints: z.array(checkpointViewSchema).readonly().default([]),
  recentResults: z
    .array(
      z.object({
        session: sessionAggregateResponseSchema.shape.session,
        scoring: scoringResultViewSchema.nullable(),
        contractEvaluation: contractEvaluationSummaryViewSchema.optional(),
        gamification: sessionGamificationReceiptSchema.optional()
      })
    )
    .readonly()
    .default([]),
  progress: progressSummarySchema
    .nullable()
    .optional()
    .transform((value) => value ?? null)
});

const resultsListResponseSchema = z.object({
  results: z
    .array(
      z.object({
        session: sessionAggregateResponseSchema.shape.session,
        scoring: scoringResultViewSchema.nullable(),
        contractEvaluation: contractEvaluationSummaryViewSchema.optional(),
        gamification: sessionGamificationReceiptSchema.optional()
      })
    )
    .readonly()
});

const progressResponseSchema = z.object({
  progress: progressSummarySchema,
  equippedAvatar: avatarSchema.optional(),
  avatars: z
    .array(
      z.object({
        avatar: avatarSchema,
        unlocked: z.boolean(),
        equipped: z.boolean(),
        hint: z.string().optional()
      })
    )
    .readonly()
    .default([]),
  recentXpAwards: z.array(sessionGamificationReceiptSchema).readonly().default([])
});

const avatarCatalogResponseSchema = z.object({
  equippedAvatarId: z.string().optional(),
  items: z
    .array(
      z.object({
        avatar: avatarSchema,
        unlocked: z.boolean(),
        equipped: z.boolean(),
        hint: z.string().optional()
      })
    )
    .readonly()
});

const vivaSummarySchema = z.object({
  sessionId: z.string().min(1),
  currentAttempt: vivaAttemptViewSchema.optional(),
  attempts: z.array(vivaAttemptViewSchema).readonly().default([]),
  canAnswer: z.boolean().default(false),
  nextPrompt: z.string().optional(),
  notes: z.string().optional()
});

const vivaAnswerResponseSchema = z.object({
  viva: vivaSummarySchema
});

const notificationsListResponseSchema = z.object({
  notifications: z.array(notificationSchema).readonly().default([])
});

type Parser<T> = {
  parse: (value: unknown) => T;
};

export type ApiClientOptions = {
  backendUrl: string;
  getAuthSession: () => Promise<AuthSession | null>;
  onAuthSession: (session: AuthSession | null) => Promise<void>;
  fetchImpl?: typeof fetch;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseJsonResponse<T>(response: Response, parser: Parser<T>) {
  const json = await response.json();
  return parser.parse(json);
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.backendUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init: RequestInit,
    parser: Parser<T>,
    retryOn401 = true
  ): Promise<T> {
    const auth = await options.getAuthSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
      ...(auth?.tokens.accessToken
        ? { Authorization: `Bearer ${auth.tokens.accessToken}` }
        : {})
    };

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers
    });

    if (response.status === 401 && retryOn401 && auth?.tokens.refreshToken) {
      try {
        const refreshed = await refreshSessionTokens(
          baseUrl,
          auth.tokens.refreshToken,
          fetchImpl
        );
        const nextAuth: AuthSession = {
          ...auth,
          tokens: refreshed
        };
        await writeStoredAuthSession(nextAuth);
        await options.onAuthSession(nextAuth);
        return request(path, init, parser, false);
      } catch {
        await clearStoredAuthSession();
        await options.onAuthSession(null);
        throw new ApiError(401, "Authentication expired.");
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, `Request failed with status ${response.status}.`);
    }

    return parseJsonResponse(response, parser);
  }

  return {
    async login(email: string, password: string) {
      const response = await fetchImpl(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new ApiError(response.status, `Login failed with status ${response.status}.`);
      }

      return parseJsonResponse(response, loginResponseSchema) satisfies Promise<LoginResponse>;
    },
    async me() {
      return request("/auth/me", { method: "GET" }, meResponseSchema) satisfies Promise<MeResponse>;
    },
    async getCurrentSessionSummary() {
      return request(
        "/sessions/current",
        { method: "GET" },
        currentSessionSummarySchema
      ) satisfies Promise<HomeSummary>;
    },
    async getSession(id: string) {
      return request(`/sessions/${id}`, { method: "GET" }, getSessionResponseSchema) satisfies Promise<GetSessionResponse>;
    },
    async getContract(id: string) {
      return request(`/contracts/${id}`, { method: "GET" }, getContractResponseSchema) satisfies Promise<GetContractResponse>;
    },
    async completeCheckpoint(
      sessionId: string,
      checkpointId: string,
      input: SessionActionRequest & { note?: string }
    ) {
      const body = sessionActionRequestSchema.extend({
        note: z.string().max(2_000).optional()
      }).parse(input);

      return request(
        `/sessions/${sessionId}/checkpoints/${checkpointId}/complete`,
        {
          method: "POST",
          body: JSON.stringify(body)
        },
        z.object({
          checkpoint: checkpointViewSchema
        })
      );
    },
    async submitArtifact(sessionId: string, input: SubmitArtifactRequest) {
      const body = submitArtifactRequestSchema.parse(input);
      return request(
        `/sessions/${sessionId}/submit-artifact`,
        {
          method: "POST",
          body: JSON.stringify(body)
        },
        submitArtifactResponseSchema
      ) satisfies Promise<SubmitArtifactResponse>;
    },
    async submitArtifactPayload(payload: ArtifactSubmitPayload) {
      return this.submitArtifact(payload.sessionId, {
        ...payload.artifact,
        createdByUserId: undefined
      });
    },
    async getScoring(sessionId: string) {
      return request(
        `/sessions/${sessionId}/scoring`,
        { method: "GET" },
        getScoringResponseSchema
      ) satisfies Promise<GetScoringResponse>;
    },
    async getEvents(sessionId: string) {
      return request(
        `/sessions/${sessionId}/events`,
        { method: "GET" },
        getEventsResponseSchema
      ) satisfies Promise<GetEventsResponse>;
    },
    async requestReview(sessionId: string, input: RequestReviewRequest) {
      const body = requestReviewRequestSchema.parse(input);
      return request(
        `/sessions/${sessionId}/request-review`,
        {
          method: "POST",
          body: JSON.stringify(body)
        },
        reviewResultResponseSchema
      ) satisfies Promise<ReviewResultResponse>;
    },
    async getResults() {
      return request("/sessions/results", { method: "GET" }, resultsListResponseSchema) satisfies Promise<ResultsListResponse>;
    },
    async getProgress() {
      return request("/progress/summary", { method: "GET" }, progressResponseSchema) satisfies Promise<ProgressResponse>;
    },
    async getAvatars() {
      return request("/progress/avatars", { method: "GET" }, avatarCatalogResponseSchema) satisfies Promise<AvatarCatalogResponse>;
    },
    async equipAvatar(avatarId: string) {
      return request(
        "/progress/avatar/equip",
        {
          method: "POST",
          body: JSON.stringify({ avatarId })
        },
        z.object({
          equippedAvatarId: z.string().min(1)
        })
      );
    },
    async getViva(sessionId: string) {
      return request(`/sessions/${sessionId}/viva`, { method: "GET" }, vivaSummarySchema) satisfies Promise<VivaSummary>;
    },
    async submitVivaAnswer(sessionId: string, input: VivaAnswerRequest) {
      return request(
        `/sessions/${sessionId}/viva/answer`,
        {
          method: "POST",
          body: JSON.stringify(input)
        },
        vivaAnswerResponseSchema
      ) satisfies Promise<VivaAnswerResponse>;
    },
    async registerPushToken(pushToken: string) {
      return request(
        "/notifications/push/register",
        {
          method: "POST",
          body: JSON.stringify({ pushToken })
        },
        z.object({
          registered: z.boolean().default(true)
        })
      );
    },
    async getNotifications() {
      return request(
        "/notifications",
        {
          method: "GET"
        },
        notificationsListResponseSchema
      ) satisfies Promise<NotificationsListResponse>;
    }
  };
}
