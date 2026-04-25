export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage = "Request failed",
): string {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (typeof error !== "object") {
    return fallbackMessage;
  }

  const topLevel = error as Record<string, unknown>;
  const candidates = [
    topLevel,
    getRecord(topLevel.data),
    getRecord(topLevel.error),
  ].filter(Boolean) as Record<string, unknown>[];

  for (const candidate of candidates) {
    const directMessage = readFirstString(candidate, [
      "message",
      "detail",
      "error",
    ]);
    if (directMessage) {
      return directMessage;
    }

    const listMessage = readArrayMessage(candidate.errors);
    if (listMessage) {
      return listMessage;
    }
  }

  return fallbackMessage;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function readFirstString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function readArrayMessage(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const message = (entry as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }

      return null;
    })
    .filter((entry): entry is string => Boolean(entry && entry.trim()));

  if (normalized.length === 0) {
    return null;
  }

  return normalized.join(", ");
}
