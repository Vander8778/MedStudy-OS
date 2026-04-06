"use client";

import type { User } from "@medstudy/contracts";

export type AdminRole = "admin" | "support";

export type AdminSession = {
  token: string;
  user: User & {
    role: User["role"] | AdminRole;
  };
  adminRole: AdminRole;
};

const AUTH_STORAGE_KEY = "medstudy:web-admin:session";

function canUseWindow() {
  return typeof window !== "undefined";
}

export function normalizeAdminRole(email: string, role?: string): AdminRole | null {
  if (role === "admin" || role === "support") {
    return role;
  }

  const normalizedEmail = email.trim().toLowerCase();
  // Development-only fallback for local MVP workflows when backend admin roles are not
  // fully provisioned yet. Remove before production so email prefixes never grant access.
  if (normalizedEmail.startsWith("admin@") || normalizedEmail.includes("+admin@")) {
    return "admin";
  }

  if (normalizedEmail.startsWith("support@") || normalizedEmail.includes("+support@")) {
    return "support";
  }

  return null;
}

export function isAdminSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AdminSession>;
  return Boolean(
    candidate.token &&
      candidate.user &&
      typeof candidate.user.email === "string" &&
      (candidate.adminRole === "admin" || candidate.adminRole === "support")
  );
}

export function readStoredAdminSession(): AdminSession | null {
  if (!canUseWindow()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isAdminSession(parsed)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAdminSession(session: AdminSession | null) {
  if (!canUseWindow()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAdminSession() {
  writeStoredAdminSession(null);
}

export function expireStoredAdminSession(loginPath = "/login") {
  clearStoredAdminSession();

  if (!canUseWindow()) {
    return;
  }

  const replace = window.location?.replace;
  if (typeof replace !== "function") {
    return;
  }

  if (window.location.pathname !== loginPath) {
    replace(loginPath);
  }
}
