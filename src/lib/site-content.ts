import blueprintJson from "../../content/blueprint.json";
import { emptyNavBlueprint } from "@/components/navs/blueprint";
import { readInventorySlice } from "@/components/inventory/data";
import { readShopSlice } from "@/components/shops/data";
import { parseBrochureBlueprint } from "@/lib/brochure/schema";
import type { BrochureContactContent, BrochureNavContent, BrochureNavLink } from "@/types/brochure";

export function siteBlueprint() {
  return parseBrochureBlueprint(blueprintJson);
}

export function siteShop() {
  return readShopSlice(siteBlueprint());
}

export function siteInventory() {
  return readInventorySlice(siteBlueprint());
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
  return [];
}

export function siteContact(): BrochureContactContent | null {
  const slice = siteBlueprint().BrochureContact_1;
  if (!slice || slice.component !== "BrochureContact") return null;
  const { component: _component, ...data } = slice;
  return data;
}

export function siteChrome() {
  const nav = siteNav();
  const contact = siteContact();
  return {
    businessName: nav.businessName.trim() || "The Card Cave",
    description: nav.description.trim(),
    faviconUrl: nav.faviconUrl.trim(),
    shareImageUrl: nav.shareImageUrl.trim(),
    logoUrl: nav.logoImageUrl.trim(),
    email: contact?.email.trim() ?? "",
    whatsapp: contact?.whatsapp.trim() ?? "",
  };
}
