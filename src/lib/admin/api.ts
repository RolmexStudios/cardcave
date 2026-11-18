import type { BrochureBlueprint, BrochureInstanceContent } from "@/types/brochure";
import {
  releasedMediaFilenames,
  rewriteMediaUrl,
  trackUploadedMedia,
} from "@/lib/admin/media-url";
import type { SiteConfig } from "@/lib/admin/site";

export class AdminApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request<T>(
  site: SiteConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${site.adminApi}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...init.headers,
    },
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: text };
    }
  }
  if (!response.ok) {
    const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const message =
      "error" in payload
        ? String(payload.error)
        : `Request failed (${response.status})`;
    const retryHeader = response.headers.get("retry-after");
    const retryAfter =
      typeof payload.retryAfter === "number"
        ? payload.retryAfter
        : retryHeader
          ? Number(retryHeader)
          : undefined;
    throw new AdminApiError(
      message,
      response.status,
      Number.isFinite(retryAfter) ? retryAfter : undefined,
    );
  }
  return data as T;
}

function authHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    authorization: `Bearer ${token}`,
    ...extra,
  };
}

export function fetchAccess(site: SiteConfig) {
  return request<{ loginEnabled: boolean }>(
    site,
    `/v1/sites/${site.siteId}/access`,
  );
}

export function fetchLiveBlueprint(site: SiteConfig) {
  return request<BrochureBlueprint>(
    site,
    `/v1/sites/${site.siteId}/blueprint`,
  );
}

export function loginSite(
  site: SiteConfig,
  username: string,
  password: string,
) {
  return request<{ token: string }>(site, `/v1/sites/${site.siteId}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password, siteId: site.siteId }),
  });
}

export function logoutSite(site: SiteConfig, token: string) {
  return request<{ ok: boolean }>(site, `/v1/sites/${site.siteId}/logout`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function changeSitePassword(
  site: SiteConfig,
  token: string,
  currentPassword: string,
  newPassword: string,
) {
  return request<{ ok: boolean }>(site, `/v1/sites/${site.siteId}/password`, {
    method: "POST",
    headers: authHeaders(token, { "content-type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function saveInstance(
  site: SiteConfig,
  token: string,
  instanceId: string,
  content: BrochureInstanceContent,
) {
  return request<{ ok: boolean; instanceId: string }>(
    site,
    `/v1/sites/${site.siteId}/blueprint/${instanceId}`,
    {
      method: "PUT",
      headers: authHeaders(token, { "content-type": "application/json" }),
      body: JSON.stringify(content),
    },
  );
}

export async function uploadImage(
  site: SiteConfig,
  token: string,
  blob: Blob,
): Promise<string> {
  const response = await fetch(
    `${site.adminApi}/v1/sites/${site.siteId}/media`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": blob.type || "image/jpeg",
      },
      body: blob,
    },
  );
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed");
  }
  const url = rewriteMediaUrl(data.url, site.adminApi);
  trackUploadedMedia(url, site.siteId);
  return url;
}

export async function deleteSiteMedia(
  site: SiteConfig,
  token: string,
  filename: string,
): Promise<void> {
  try {
    await request<{ ok: boolean }>(
      site,
      `/v1/sites/${site.siteId}/media/${encodeURIComponent(filename)}`,
      {
        method: "DELETE",
        headers: authHeaders(token),
      },
    );
  } catch {
    // Already gone, or the Worker is an older build without DELETE.
  }
}

export async function pruneReleasedMedia(
  site: SiteConfig,
  token: string,
  candidates: unknown,
  keep: unknown,
): Promise<void> {
  const released = releasedMediaFilenames(candidates, keep, site.siteId);
  if (released.length === 0) {
    return;
  }
  await Promise.all(
    released.map((filename) => deleteSiteMedia(site, token, filename)),
  );
}
