import { invoke } from "@tauri-apps/api/core";
import type { AuthSession, AuthUser } from "../types";

const AUTH_STORAGE_KEY = "medstudy.desktop.auth";

type LoginResponse = AuthSession;

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function readStoredAuthSession(): AuthSession | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function writeStoredAuthSession(session: AuthSession | null) {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function login(email: string, backendUrl: string): Promise<LoginResponse> {
  if (isTauriRuntime()) {
    return invoke<LoginResponse>("login_stub", { email });
  }

  const response = await fetch(`${backendUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}.`);
  }

  return (await response.json()) as LoginResponse;
}

export async function me(
  backendUrl: string,
  token?: string
): Promise<AuthUser> {
  const response = await fetch(`${backendUrl}/auth/me`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });

  if (!response.ok) {
    throw new Error(`Failed to load current user: ${response.status}.`);
  }

  return (await response.json()) as AuthUser;
}
