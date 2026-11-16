import type { BrochureBlueprint, BrochureInstanceContent } from "@/types/brochure";
import type { SiteConfig } from "@/lib/admin/site";

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
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
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
  return data.url;
}
