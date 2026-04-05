import type { GetScoringResponse, GetSessionResponse } from "@medstudy/contracts";
import type { AvatarCatalogItem, HomeSummary } from "../types/app";

export function getHomeScreenSections(summary: HomeSummary | null) {
  return {
    hasSessionCard: Boolean(summary?.activeSession || summary?.plannedSession),
    hasDueCheckpoints: Boolean(summary?.dueCheckpoints.length),
    hasRecentResults: Boolean(summary?.recentResults.length),
    hasProgress: Boolean(summary?.progress),
    headings: ["Today", "Due checkpoints", "Recent results", "Progress snapshot"]
  };
}

export function getSessionDetailSections(
  session: GetSessionResponse | null,
  scoring: GetScoringResponse["scoring"]
) {
  return {
    headings: ["Checkpoints", "Artifacts", "Viva"],
    warningCount: session?.session.warningCount ?? 0,
    penaltyCount: session?.penalties.length ?? 0,
    hasScore: Boolean(scoring)
  };
}

export function getOfflineBannerMessage(
  isOnline: boolean,
  cacheState?: "fresh" | "stale" | "expired" | "missing"
) {
  if (isOnline && cacheState !== "stale") {
    return null;
  }

  return isOnline
    ? "Showing stale cached data. Pull to refresh when convenient."
    : "Offline mode: safe actions may queue, but live session truth still comes from the backend.";
}

export function getVivaConnectivityMessage(isOnline: boolean) {
  if (isOnline) {
    return null;
  }

  return "Viva answers are never queued offline. Reconnect to continue.";
}

export function getAvatarStatusLabel(item: AvatarCatalogItem) {
  if (!item.unlocked) {
    return item.hint ?? "Locked";
  }

  if (item.equipped) {
    return "Equipped";
  }

  return "Unlocked";
}
