const MEDIA_PATH =
  /^\/v1\/sites\/[a-z0-9][a-z0-9-]*\/media\/[A-Za-z0-9._-]+\/?$/;
const MEDIA_FILE =
  /^\/v1\/sites\/([a-z0-9][a-z0-9-]*)\/media\/([A-Za-z0-9._-]+)\/?$/;

const pendingUploads = new Set<string>();

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

export function mediaFilenameForSite(url: string, siteId: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(MEDIA_FILE);
    if (!match || match[1] !== siteId) {
      return null;
    }
    return match[2];
  } catch {
    return null;
  }
}

export function trackUploadedMedia(url: string, siteId: string) {
  const filename = mediaFilenameForSite(url, siteId);
  if (filename) {
    pendingUploads.add(filename);
  }
}

export function collectMediaFilenames(value: unknown, siteId: string): Set<string> {
  const found = new Set<string>();
  walk(value);
  return found;

  function walk(node: unknown) {
    if (typeof node === "string") {
      const filename = mediaFilenameForSite(node, siteId);
      if (filename) {
        found.add(filename);
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }
    if (node && typeof node === "object") {
      for (const item of Object.values(node as Record<string, unknown>)) {
        walk(item);
      }
    }
  }
}

export function releasedMediaFilenames(
  candidates: unknown,
  keep: unknown,
  siteId: string,
): string[] {
  const kept = collectMediaFilenames(keep, siteId);
  const names = new Set([
    ...collectMediaFilenames(candidates, siteId),
    ...pendingUploads,
  ]);
  pendingUploads.clear();
  return [...names].filter((filename) => !kept.has(filename));
}
