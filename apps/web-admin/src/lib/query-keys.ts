export const queryKeys = {
  students: (query: string) => ["students", query] as const,
  studentDetail: (userId: string) => ["student", userId] as const,
  sessions: (query: string) => ["sessions", query] as const,
  sessionDetail: (sessionId: string) => ["session", sessionId] as const,
  sessionAudit: (sessionId: string) => ["session-audit", sessionId] as const,
  contracts: (query: string) => ["contracts", query] as const,
  contractDetail: (contractId: string) => ["contract", contractId] as const,
  liveSessions: () => ["live-sessions"] as const,
  penalties: (query: string) => ["penalties", query] as const
} as const;
