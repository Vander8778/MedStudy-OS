import {
  createContractRequestSchema,
  getContractResponseSchema,
  getEventsResponseSchema,
  getScoringResponseSchema,
  getSessionResponseSchema,
  sessionActionRequestSchema,
  sessionMutationResponseSchema,
  type ContractSummaryView,
  type ContractTerms,
  type ContractEvaluationSummaryView,
  type GetContractResponse,
  type GetEventsResponse,
  type GetScoringResponse,
  type GetSessionResponse,
  type PenaltyView,
  type ProgressSummary,
  type Profile,
  type ScoringResultView,
  type SessionEventView,
  type SessionState,
  type User
} from "@medstudy/contracts";
import {
  expireStoredAdminSession,
  normalizeAdminRole,
  type AdminRole,
  type AdminSession
} from "./auth";
import { getConservativeSessionActions, type AdminActionId } from "./permissions";

export type StudentListItem = {
  user: User;
  profile?: Profile;
  currentLevel?: number;
  streakLength?: number;
  latestSessionState?: SessionState;
};

export type StudentDetailView = {
  user: User;
  profile?: Profile;
  activeContracts: readonly ContractSummaryView[];
  sessionHistory: readonly GetSessionResponse[];
  penalties: readonly PenaltyView[];
  progress: ProgressSummary | null;
  masterySummary: readonly {
    id: string;
    label: string;
    percent: number;
  }[];
};

export type SessionAuditEntry = {
  id: string;
  title: string;
  occurredAt: string;
  actorLabel: string;
  notes?: string;
  source: "backend_audit" | "session_event" | "dependency_notice";
};

export type AdminActionDefinition = {
  id: AdminActionId;
  label: string;
  requiresNote: boolean;
  enabled: boolean;
  reason?: string;
};

export type SessionDetailView = {
  aggregate: GetSessionResponse;
  scoring: ScoringResultView | null;
  contractEvaluation: ContractEvaluationSummaryView | null;
  antiAvoidance: {
    summary: string;
    severity?: string;
    signals: readonly string[];
    source: "backend" | "unavailable";
  };
  timeline: readonly SessionEventView[];
  auditEntries: readonly SessionAuditEntry[];
  availableAdminActions: readonly AdminActionDefinition[];
  dependencyWarnings: readonly string[];
};

export type SessionsListResponse = {
  sessions: readonly GetSessionResponse[];
  nextCursor?: string;
};

export type ContractsListResponse = {
  contracts: readonly ContractSummaryView[];
  nextCursor?: string;
};

export type LiveSessionRow = {
  sessionId: string;
  studentLabel: string;
  title: string;
  state: SessionState;
  validMinutes: number;
  warningCount: number;
  missedCheckpointCount: number;
  lastHeartbeatAgeSeconds?: number;
};

export type PenaltiesListResponse = {
  penalties: readonly PenaltyView[];
  nextCursor?: string;
};

export type AdminActionInput = {
  note?: string;
  actorLabel?: string;
};

export type ContractDraftInput = {
  userId: string;
  name: string;
  description?: string;
  status?: ContractSummaryView["status"];
  tags: string[];
  activeRange: ContractSummaryView["activeRange"];
  terms: ContractTerms;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ApiDependencyError extends Error {}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_MEDSTUDY_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

type RequestOptions = {
  session?: AdminSession | null;
  init?: RequestInit;
  allow404?: boolean;
};

function buildAdminActionDefinitions(
  role: AdminRole,
  sessionState: SessionState
): readonly AdminActionDefinition[] {
  // TODO: Replace this conservative fallback with backend-provided
  // availableAdminActions once the admin session-detail endpoint exposes it.
  return getConservativeSessionActions(role, sessionState).map((action) => ({
    id: action,
    label:
      action === "force_review"
        ? "Force Review"
        : action === "override"
          ? "Override Outcome"
          : action === "excuse"
            ? "Excuse Session"
            : action === "penalize"
              ? "Penalize Session"
              : action,
    requiresNote: action !== "force_review",
    enabled: true
  }));
}

export function validateContractDraft(input: ContractDraftInput) {
  const parsed = createContractRequestSchema.safeParse({
    userId: input.userId,
    name: input.name,
    description: input.description,
    activeRange: input.activeRange,
    terms: input.terms,
    tags: input.tags
  });

  if (parsed.success) {
    return { valid: true as const, errors: [] as string[] };
  }

  return {
    valid: false as const,
    errors: parsed.error.issues.map((issue) => issue.message)
  };
}

function requiredValue<T>(value: T | null, message: string): T {
  if (value === null) {
    throw new ApiError(500, message);
  }

  return value;
}

export function createApiClient(baseUrl = DEFAULT_BASE_URL, fetchImpl: typeof fetch = fetch) {
  const apiBaseUrl = `${baseUrl}/api`;

  async function requestJson<T>(
    path: string,
    parser: { parse: (value: unknown) => T } | null,
    options: RequestOptions = {}
  ) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.session?.token
        ? { Authorization: `Bearer ${options.session.token}` }
        : {}),
      ...(options.init?.headers ?? {})
    };

    const response = await fetchImpl(`${apiBaseUrl}${path}`, {
      ...(options.init ?? {}),
      headers
    });

    if (response.status === 401) {
      expireStoredAdminSession();
      throw new ApiError(401, "Authentication expired.");
    }

    if (response.status === 404 && options.allow404) {
      return null;
    }

    if (!response.ok) {
      throw new ApiError(response.status, `Request failed with status ${response.status}.`);
    }

    const json = await response.json();
    return parser ? parser.parse(json) : (json as T);
  }

  function dependencyError(message: string): never {
    throw new ApiDependencyError(message);
  }

  return {
    async login(email: string, password: string) {
      const json = requiredValue(
        await requestJson<{ token: string; user: User }>("/auth/login", null, {
          init: {
            method: "POST",
            body: JSON.stringify({ email, password })
          }
        }),
        "Missing auth login response."
      );

      const adminRole = normalizeAdminRole(email, json.user.role);
      if (!adminRole) {
        throw new ApiError(403, "This account is not allowed to access the admin dashboard.");
      }

      return {
        token: json.token,
        user: {
          ...json.user,
          role: adminRole
        },
        adminRole
      } satisfies AdminSession;
    },

    async me(session: AdminSession) {
      const json = requiredValue(
        await requestJson<{ id: string; email: string; role: string }>(
          "/auth/me",
          null,
          { session }
        ),
        "Missing auth profile response."
      );
      const adminRole = normalizeAdminRole(json.email, json.role) ?? session.adminRole;

      return {
        token: session.token,
        user: {
          id: json.id,
          email: json.email,
          role: adminRole,
          status: "active",
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString()
        },
        adminRole
      } satisfies AdminSession;
    },

    async getSessionDetail(sessionId: string, session: AdminSession) {
      const [aggregateResponse, scoringResponse, eventsResponse, audit] = await Promise.all([
        requestJson<GetSessionResponse>(`/sessions/${sessionId}`, getSessionResponseSchema, {
          session
        }),
        requestJson<GetScoringResponse>(`/sessions/${sessionId}/scoring`, getScoringResponseSchema, {
          session
        }),
        requestJson<GetEventsResponse>(`/sessions/${sessionId}/events`, getEventsResponseSchema, {
          session
        }),
        requestJson<{ entries: readonly SessionAuditEntry[] }>(
          `/admin/sessions/${sessionId}/audit`,
          null,
          { session, allow404: true }
        )
      ]);
      const aggregate = requiredValue(
        aggregateResponse,
        "Missing session aggregate response."
      );
      const scoring = requiredValue(scoringResponse, "Missing scoring response.");
      const events = requiredValue(eventsResponse, "Missing events response.");

      const dependencyWarnings: string[] = [];
      if (!audit) {
        dependencyWarnings.push(
          "Unified admin audit endpoint is not available yet. Showing session events as the fallback timeline."
        );
      }
      dependencyWarnings.push(
        "Available admin actions are currently derived conservatively in the client until the backend exposes availableAdminActions."
      );
      dependencyWarnings.push(
        "Override action is MVP-bound to route into review_pending until the backend exposes supported override target outcomes."
      );

      return {
        aggregate,
        scoring: scoring.scoring,
        contractEvaluation: null,
        antiAvoidance: {
          summary:
            "Backend anti-avoidance summary endpoint is not available yet for the admin dashboard.",
          signals: [],
          source: "unavailable"
        },
        timeline: events.events,
        auditEntries:
          audit?.entries ??
          events.events.map((event) => ({
            id: event.id,
            title: event.type.replaceAll("_", " "),
            occurredAt: event.occurredAt,
            actorLabel: event.actor.label ?? event.actor.userId ?? event.actor.actorType,
            notes: event.state ? `State: ${event.state}` : undefined,
            source: "session_event"
          })),
        availableAdminActions: buildAdminActionDefinitions(
          session.adminRole,
          aggregate.session.state
        ),
        dependencyWarnings
      } satisfies SessionDetailView;
    },

    async getSessionAudit(sessionId: string, session: AdminSession) {
      const detail = await this.getSessionDetail(sessionId, session);
      return {
        entries: detail.auditEntries,
        dependencyWarnings: detail.dependencyWarnings
      };
    },

    async listSessions(search: URLSearchParams, session: AdminSession) {
      const result = await requestJson<SessionsListResponse>(
        `/admin/sessions?${search.toString()}`,
        null,
        { session, allow404: true }
      );
      if (!result) {
        dependencyError("Backend admin sessions list endpoint is not available yet.");
      }
      return result;
    },

    async listLiveSessions(session: AdminSession) {
      const result = await requestJson<{ sessions: readonly LiveSessionRow[] }>(
        "/admin/live-sessions",
        null,
        { session, allow404: true }
      );
      if (!result) {
        dependencyError("Backend live monitor endpoint is not available yet.");
      }
      return result.sessions;
    },

    async listStudents(search: URLSearchParams, session: AdminSession) {
      const result = await requestJson<{ students: readonly StudentListItem[] }>(
        `/admin/students?${search.toString()}`,
        null,
        { session, allow404: true }
      );
      if (!result) {
        dependencyError("Backend student list endpoint is not available yet.");
      }
      return result.students;
    },

    async getStudentDetail(userId: string, session: AdminSession) {
      const result = await requestJson<StudentDetailView>(
        `/admin/students/${userId}`,
        null,
        { session, allow404: true }
      );
      if (!result) {
        dependencyError("Backend student detail endpoint is not available yet.");
      }
      return result;
    },

    async listContracts(search: URLSearchParams, session: AdminSession) {
      const result = await requestJson<ContractsListResponse>(
        `/admin/contracts?${search.toString()}`,
        null,
        { session, allow404: true }
      );
      if (!result) {
        dependencyError("Backend contracts list endpoint is not available yet.");
      }
      return result;
    },

    async getContract(contractId: string, session: AdminSession) {
      return requiredValue(
        await requestJson<GetContractResponse>(
          `/contracts/${contractId}`,
          getContractResponseSchema,
          { session }
        ),
        "Missing contract detail response."
      );
    },

    async createContract(input: ContractDraftInput, session: AdminSession) {
      const parsed = createContractRequestSchema.parse({
        userId: input.userId,
        name: input.name,
        description: input.description,
        activeRange: input.activeRange,
        terms: input.terms,
        tags: input.tags
      });

      return requiredValue(
        await requestJson<GetContractResponse>("/contracts", getContractResponseSchema, {
          session,
          init: {
            method: "POST",
            body: JSON.stringify(parsed)
          }
        }),
        "Missing contract create response."
      );
    },

    async updateContract(contractId: string, input: ContractDraftInput, session: AdminSession) {
      const parsed = createContractRequestSchema.parse({
        userId: input.userId,
        name: input.name,
        description: input.description,
        activeRange: input.activeRange,
        terms: input.terms,
        tags: input.tags
      });

      const result = await requestJson<GetContractResponse>(
        `/admin/contracts/${contractId}`,
        getContractResponseSchema,
        {
          session,
          allow404: true,
          init: {
            method: "PATCH",
            body: JSON.stringify(parsed)
          }
        }
      );
      if (!result) {
        dependencyError("Backend contract update endpoint is not available yet.");
      }
      return result;
    },

    async listPenalties(search: URLSearchParams, session: AdminSession) {
      const result = await requestJson<PenaltiesListResponse>(
        `/admin/penalties?${search.toString()}`,
        null,
        { session, allow404: true }
      );
      if (!result) {
        dependencyError("Backend penalties list endpoint is not available yet.");
      }
      return result;
    },

    async revokePenalty(penaltyId: string, input: AdminActionInput, session: AdminSession) {
      const result = await requestJson<{ penalty: PenaltyView }>(
        `/admin/penalties/${penaltyId}/revoke`,
        null,
        {
          session,
          allow404: true,
          init: {
            method: "POST",
            body: JSON.stringify(input)
          }
        }
      );
      if (!result) {
        dependencyError("Backend penalty revoke endpoint is not available yet.");
      }
      return result.penalty;
    },

    async confirmPenalty(penaltyId: string, input: AdminActionInput, session: AdminSession) {
      const result = await requestJson<{ penalty: PenaltyView }>(
        `/admin/penalties/${penaltyId}/confirm`,
        null,
        {
          session,
          allow404: true,
          init: {
            method: "POST",
            body: JSON.stringify(input)
          }
        }
      );
      if (!result) {
        dependencyError("Backend penalty confirm endpoint is not available yet.");
      }
      return result.penalty;
    },

    async excuseSession(sessionId: string, input: AdminActionInput, session: AdminSession) {
      const body = sessionActionRequestSchema.parse({
        actor: {
          actorType: "user",
          userId: session.user.id,
          label: input.actorLabel ?? session.user.email
        }
      });

      return requestJson(`/sessions/${sessionId}/excuse`, sessionMutationResponseSchema, {
        session,
        init: {
          method: "POST",
          body: JSON.stringify({
            ...body,
            note: input.note
          })
        }
      });
    },

    async penalizeSession(sessionId: string, input: AdminActionInput, session: AdminSession) {
      const body = sessionActionRequestSchema.parse({
        actor: {
          actorType: "user",
          userId: session.user.id,
          label: input.actorLabel ?? session.user.email
        }
      });

      return requestJson(`/sessions/${sessionId}/penalize`, sessionMutationResponseSchema, {
        session,
        init: {
          method: "POST",
          body: JSON.stringify({
            ...body,
            note: input.note
          })
        }
      });
    },

    async forceReviewSession(sessionId: string, session: AdminSession) {
      const body = sessionActionRequestSchema.parse({
        actor: {
          actorType: "user",
          userId: session.user.id,
          label: session.user.email
        }
      });

      return requestJson(`/sessions/${sessionId}/request-review`, null, {
        session,
        init: {
          method: "POST",
          body: JSON.stringify(body)
        }
      });
    },

    async overrideSessionOutcome(
      sessionId: string,
      input: AdminActionInput & { outcome: SessionState },
      session: AdminSession
    ) {
      const result = await requestJson(
        `/admin/sessions/${sessionId}/override`,
        sessionMutationResponseSchema,
        {
          session,
          allow404: true,
          init: {
            method: "POST",
            body: JSON.stringify(input)
          }
        }
      );
      if (!result) {
        dependencyError("Backend session override endpoint is not available yet.");
      }
      return result;
    }
  };
}

export type AdminApiClient = ReturnType<typeof createApiClient>;
