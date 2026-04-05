import { submitArtifactRequestSchema } from "@medstudy/contracts";
import { createApiClient } from "./api-client";
import { MOBILE_API_BASE_URL } from "../utils/constants";
import { useAuthStore } from "../state/auth-store";

let mobileApiClient: ReturnType<typeof createApiClient> | undefined;

export function getMobileApiClient() {
  if (!mobileApiClient) {
    mobileApiClient = createApiClient({
      backendUrl: MOBILE_API_BASE_URL,
      getAuthSession: async () => useAuthStore.getState().session,
      onAuthSession: async (session) => {
        useAuthStore.getState().setSession(session);
      }
    });
  }

  return mobileApiClient;
}

export function parseQueuedArtifactActionPayload(payload: Record<string, unknown>) {
  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : undefined;
  if (!sessionId) {
    throw new Error("Queued artifact payload is missing sessionId.");
  }

  const parsedArtifact = submitArtifactRequestSchema.safeParse(payload.artifact);
  if (!parsedArtifact.success) {
    throw new Error("Queued artifact payload is invalid.");
  }

  return {
    sessionId,
    artifact: parsedArtifact.data
  };
}
