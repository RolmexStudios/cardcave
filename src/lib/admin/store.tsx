"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BrochureBlueprint,
  BrochureInstanceContent,
} from "@/types/brochure";
import { parseBrochureBlueprint } from "@/lib/brochure/schema";
import {
  fetchAccess,
  fetchLiveBlueprint,
  saveInstance as saveInstanceRequest,
} from "@/lib/admin/api";
import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken,
} from "@/lib/admin/session";
import type { SiteConfig } from "@/lib/admin/site";

type BrochureStoreValue = {
  blueprint: BrochureBlueprint;
  bundled: BrochureBlueprint;
  site: SiteConfig | null;
  liveReady: boolean;
  loginEnabled: boolean;
  token: string | null;
  signedIn: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  setToken: (token: string | null) => void;
  previewInstance: (instanceId: string, content: BrochureInstanceContent) => void;
  restoreInstance: (instanceId: string, content: BrochureInstanceContent) => void;
  persistInstance: (instanceId: string, content: BrochureInstanceContent) => Promise<void>;
};

const BrochureStoreContext = createContext<BrochureStoreValue | null>(null);

export function BrochureStoreProvider({
  bundled,
  site,
  children,
}: {
  bundled: BrochureBlueprint;
  site: SiteConfig | null;
  children: ReactNode;
}) {
  const [blueprint, setBlueprint] = useState(bundled);
  const [liveReady, setLiveReady] = useState(!site);
  const [loginEnabled, setLoginEnabled] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!site) {
      return;
    }
    const existing = readSessionToken(site.siteId);
    if (existing) {
      setTokenState(existing);
    }
  }, [site]);

  useEffect(() => {
    if (!site) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const access = await fetchAccess(site);
        if (!cancelled) {
          setLoginEnabled(access.loginEnabled);
        }
      } catch {
        if (!cancelled) {
          setLoginEnabled(false);
        }
      }
      try {
        const live = await fetchLiveBlueprint(site);
        if (!cancelled) {
          setBlueprint(parseBrochureBlueprint(live));
        }
      } catch {
        // keep bundled
      } finally {
        if (!cancelled) {
          setLiveReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [site]);

  const setToken = useCallback(
    (next: string | null) => {
      setTokenState(next);
      if (!site) {
        return;
      }
      if (next) {
        writeSessionToken(site.siteId, next);
      } else {
        clearSessionToken(site.siteId);
        setEditMode(false);
      }
    },
    [site],
  );

  const previewInstance = useCallback(
    (instanceId: string, content: BrochureInstanceContent) => {
      setBlueprint((current) => ({ ...current, [instanceId]: content }));
    },
    [],
  );

  const restoreInstance = useCallback(
    (instanceId: string, content: BrochureInstanceContent) => {
      setBlueprint((current) => ({ ...current, [instanceId]: content }));
    },
    [],
  );

  const persistInstance = useCallback(
    async (instanceId: string, content: BrochureInstanceContent) => {
      if (!site || !token) {
        throw new Error("Sign in required");
      }
      setBlueprint((current) => ({ ...current, [instanceId]: content }));
      await saveInstanceRequest(site, token, instanceId, content);
    },
    [site, token],
  );

  const value = useMemo<BrochureStoreValue>(
    () => ({
      blueprint,
      bundled,
      site,
      liveReady,
      loginEnabled,
      token,
      signedIn: Boolean(token),
      editMode,
      setEditMode,
      setToken,
      previewInstance,
      restoreInstance,
      persistInstance,
    }),
    [
      blueprint,
      bundled,
      site,
      liveReady,
      loginEnabled,
      token,
      editMode,
      setToken,
      previewInstance,
      restoreInstance,
      persistInstance,
    ],
  );

  return (
    <BrochureStoreContext.Provider value={value}>
      {children}
    </BrochureStoreContext.Provider>
  );
}

export function useBrochureStore(): BrochureStoreValue | null {
  return useContext(BrochureStoreContext);
}

export function useBrochureBlueprint(): BrochureBlueprint {
  const store = useContext(BrochureStoreContext);
  if (!store) {
    throw new Error("BrochureStoreProvider is missing");
  }
  return store.blueprint;
}

export function useOptionalBrochureBlueprint(): BrochureBlueprint | null {
  return useContext(BrochureStoreContext)?.blueprint ?? null;
}
