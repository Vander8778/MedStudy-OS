import type { SessionState } from "@medstudy/contracts";
import type { AdminRole } from "./auth";

export type AdminActionId =
  | "excuse"
  | "penalize"
  | "override"
  | "force_review"
  | "revoke_penalty"
  | "confirm_penalty";

export type NavItem = {
  href: string;
  label: string;
};

export function getVisibleNavItems(role: AdminRole): readonly NavItem[] {
  const shared = [
    { href: "/live", label: "Live" },
    { href: "/students", label: "Students" },
    { href: "/sessions", label: "Sessions" },
    { href: "/penalties", label: "Penalties" }
  ] as const;

  return role === "admin"
    ? [...shared, { href: "/contracts", label: "Contracts" }]
    : shared;
}

export function canViewContracts(role: AdminRole) {
  return role === "admin";
}

export function canUseAdminAction(role: AdminRole, action: AdminActionId) {
  if (role === "admin") {
    return true;
  }

  return action === "excuse" || action === "force_review";
}

export function getConservativeSessionActions(
  role: AdminRole,
  sessionState: SessionState
): readonly AdminActionId[] {
  const actions: AdminActionId[] = [];

  if (canUseAdminAction(role, "force_review") && sessionState !== "review_pending") {
    actions.push("force_review");
  }

  if (
    canUseAdminAction(role, "excuse") &&
    ["failed", "partial", "penalized"].includes(sessionState)
  ) {
    actions.push("excuse");
  }

  if (
    canUseAdminAction(role, "penalize") &&
    !["completed", "excused", "penalized"].includes(sessionState)
  ) {
    actions.push("penalize");
  }

  if (canUseAdminAction(role, "override")) {
    actions.push("override");
  }

  return actions;
}
