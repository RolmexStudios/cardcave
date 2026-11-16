const MEDIA_PATH =
  /^\/v1\/sites\/[a-z0-9][a-z0-9-]*\/media\/[A-Za-z0-9._-]+\/?$/;

/** Point a Worker media URL at the API host this site actually uses. */
export function rewriteMediaUrl(url: string, adminApi: string): string {
  const trimmed = url.trim();
  if (!trimmed || !adminApi) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (!MEDIA_PATH.test(parsed.pathname)) {
      return trimmed;
    }
    const api = new URL(adminApi);
    if (parsed.origin === api.origin) {
      return trimmed;
    }
    return `${api.origin}${parsed.pathname}`;
  } catch {
    return trimmed;
  }
}

export function rewriteMediaUrlsInJson<T>(value: T, adminApi: string): T {
  if (typeof value === "string") {
    return rewriteMediaUrl(value, adminApi) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteMediaUrlsInJson(item, adminApi)) as T;
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      next[key] = rewriteMediaUrlsInJson(item, adminApi);
    }
    return next as T;
  }
  return value;
}
