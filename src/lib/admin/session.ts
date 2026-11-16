const prefix = "waas-admin-session:";

export function readSessionToken(siteId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(`${prefix}${siteId}`);
  } catch {
    return null;
  }
}

export function writeSessionToken(siteId: string, token: string) {
  try {
    sessionStorage.setItem(`${prefix}${siteId}`, token);
  } catch {
    // private mode
  }
}

export function clearSessionToken(siteId: string) {
  try {
    sessionStorage.removeItem(`${prefix}${siteId}`);
  } catch {
    // private mode
  }
}
