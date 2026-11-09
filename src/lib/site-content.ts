import blueprintJson from "../../content/blueprint.json";
import { emptyNavBlueprint } from "@/components/navs/blueprint";
import { readShopSlice } from "@/components/shops/data";
import { parseBrochureBlueprint } from "@/lib/brochure/schema";
import type { BrochureContactContent, BrochureNavContent, BrochureNavLink } from "@/types/brochure";

export function siteBlueprint() {
  return parseBrochureBlueprint(blueprintJson);
}

export function siteShop() {
  return readShopSlice(siteBlueprint());
}

export function siteNav(): BrochureNavContent {
  const slice = siteBlueprint().BrochureSiteNav_1;
  if (!slice || slice.component !== "BrochureSiteNav") {
    return emptyNavBlueprint();
  }
  const { component: _component, ...data } = slice;
  return data;
}

export function siteHashLinks(): BrochureNavLink[] {
  const slice = siteBlueprint().BrochureDivider_1;
  if (!slice || slice.component !== "BrochureDivider" || slice.variant !== "swap") {
    return [];
  }
  const anchorId = slice.anchorId.trim();
  const navLabel = slice.navLabel.trim();
  if (!anchorId || !navLabel) return [];
  return [{ href: `#${anchorId}`, label: navLabel }];
}

export function siteContact(): BrochureContactContent | null {
  const slice = siteBlueprint().BrochureContact_1;
  if (!slice || slice.component !== "BrochureContact") return null;
  const { component: _component, ...data } = slice;
  return data;
}

export function siteChrome() {
  const nav = siteNav();
  return {
    businessName: nav.businessName.trim() || "Shop",
    description: nav.description.trim(),
    faviconUrl: nav.faviconUrl.trim(),
    shareImageUrl: nav.shareImageUrl.trim(),
  };
}
