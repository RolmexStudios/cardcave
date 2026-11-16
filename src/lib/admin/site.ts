export type SiteConfig = {
  siteId: string;
  adminApi: string;
};

export const DEFAULT_ADMIN_API = "https://admin.rolmexstudios.com";

export function parseSiteConfig(input: unknown): SiteConfig | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }
  const record = input as Record<string, unknown>;
  const siteId = String(record.siteId ?? "").trim();
  const adminApi = String(record.adminApi ?? DEFAULT_ADMIN_API)
    .trim()
    .replace(/\/$/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(siteId) || !adminApi) {
    return null;
  }
  return { siteId, adminApi };
}
