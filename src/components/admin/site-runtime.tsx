"use client";

import type { ReactNode } from "react";
import { MusicPlayer } from "@/components/music";
import type { BrochureBlueprint, BrochureMusicContent } from "@/types/brochure";
import { parseSiteConfig } from "@/lib/admin/site";
import {
  BrochureStoreProvider,
  useBrochureStore,
} from "@/lib/admin/store";
import { AdminChrome } from "./chrome";

export function SiteRuntime({
  bundled,
  site,
  children,
}: {
  bundled: BrochureBlueprint;
  site: unknown;
  children: ReactNode;
}) {
  return (
    <BrochureStoreProvider bundled={bundled} site={parseSiteConfig(site)}>
      <AdminChrome>
        {children}
        <LiveMusicPlayer />
      </AdminChrome>
    </BrochureStoreProvider>
  );
}

function LiveMusicPlayer() {
  const store = useBrochureStore();
  const slice = store?.blueprint.BrochureMusic_1;
  if (!slice || slice.component !== "BrochureMusic") {
    return null;
  }
  const data = slice as BrochureMusicContent & { component: "BrochureMusic" };
  const tracks = data.tracks.filter((track) => track.src.trim());
  if (tracks.length === 0) {
    return null;
  }
  return <MusicPlayer data={{ variant: data.variant, label: data.label, tracks }} />;
}
