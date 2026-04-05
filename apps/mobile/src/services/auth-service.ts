import { z } from "zod";
import { profileSchema, userSchema } from "@medstudy/contracts";
import type { AuthSession, LoginRequest, LoginResponse, MeResponse } from "../types/app";

type SecureStoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

const secureStoreMemory = new Map<string, string>();

const secureStoreFallback: SecureStoreLike = {
  async getItemAsync(key) {
    return secureStoreMemory.get(key) ?? null;
  },
  async setItemAsync(key, value) {
    secureStoreMemory.set(key, value);
  },
  async deleteItemAsync(key) {
    secureStoreMemory.delete(key);
  }
};

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

const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1)
});

let secureStoreOverride: SecureStoreLike | undefined;

export function setSecureStoreForTests(store: SecureStoreLike | undefined) {
  secureStoreOverride = store;
}

async function getSecureStore(): Promise<SecureStoreLike> {
  if (secureStoreOverride) {
    return secureStoreOverride;
  }

  try {
    const module = await import("expo-secure-store");
    return module;
  } catch {
    return secureStoreFallback;
  }
}

const AUTH_STORAGE_KEY = "mobile:auth-session";

export async function readStoredAuthSession(): Promise<AuthSession | null> {
  const store = await getSecureStore();
  const raw = await store.getItemAsync(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await store.deleteItemAsync(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function writeStoredAuthSession(session: AuthSession | null) {
  const store = await getSecureStore();
  if (!session) {
    await store.deleteItemAsync(AUTH_STORAGE_KEY);
    return;
  }

  await store.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredAuthSession() {
  const store = await getSecureStore();
  await store.deleteItemAsync(AUTH_STORAGE_KEY);
}

export async function login(
  backendUrl: string,
  credentials: LoginRequest,
  fetchImpl: typeof fetch = fetch
) {
  const response = await fetchImpl(`${backendUrl.replace(/\/$/, "")}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}.`);
  }

  const payload = loginResponseSchema.parse(await response.json()) satisfies LoginResponse;
  const session: AuthSession = {
    tokens: {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken
    },
    user: payload.user,
    profile: payload.profile
  };
  await writeStoredAuthSession(session);
  return session;
}

export async function refreshSessionTokens(
  backendUrl: string,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch
) {
  const response = await fetchImpl(`${backendUrl.replace(/\/$/, "")}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    throw new Error(`Refresh failed with status ${response.status}.`);
  }

  return refreshResponseSchema.parse(await response.json());
}

export async function fetchMe(
  backendUrl: string,
  accessToken: string,
  fetchImpl: typeof fetch = fetch
) {
  const response = await fetchImpl(`${backendUrl.replace(/\/$/, "")}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status}.`);
  }

  return meResponseSchema.parse(await response.json()) satisfies MeResponse;
}

export async function logout() {
  await clearStoredAuthSession();
}
