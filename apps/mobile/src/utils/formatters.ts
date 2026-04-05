export function formatDateTime(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatTimeRange(startsAt?: string, endsAt?: string) {
  if (!startsAt || !endsAt) {
    return "Schedule unavailable";
  }

  return `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
}

export function formatMinutes(minutes?: number) {
  if (minutes === undefined || minutes === null || Number.isNaN(minutes)) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function formatScore(score?: number | null) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "Not scored";
  }

  return `${score.toFixed(1)}%`;
}

export function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export function formatRelativeAge(cachedAt?: string) {
  if (!cachedAt) {
    return "Unknown age";
  }

  const deltaMs = Date.now() - new Date(cachedAt).getTime();
  if (deltaMs <= 0) {
    return "Just now";
  }

  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
