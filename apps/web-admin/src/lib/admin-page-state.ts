import type { AdminActionId } from "./permissions";

export function clearActionNote(
  notes: Partial<Record<AdminActionId, string>>,
  actionId: AdminActionId
) {
  return Object.fromEntries(
    Object.entries(notes).filter(([key]) => key !== actionId)
  ) as Partial<Record<AdminActionId, string>>;
}

export function getPenaltyActionKey(penaltyId: string, action: "revoke" | "confirm") {
  return `${penaltyId}:${action}`;
}
