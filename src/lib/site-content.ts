import blueprintJson from "../../content/blueprint.json";
import { emptyNavBlueprint } from "@/components/navs/blueprint";
import { readInventorySlice } from "@/components/inventory/data";
import { readShopSlice } from "@/components/shops/data";
import { parseBrochureBlueprint } from "@/lib/brochure/schema";
import type {
  BrochureBlueprint,
  BrochureContactContent,
  BrochureNavContent,
  BrochureNavLink,
} from "@/types/brochure";

export function siteBlueprint() {
  return parseBrochureBlueprint(blueprintJson);
}

export function siteShop(blueprint: BrochureBlueprint = siteBlueprint()) {
  return readShopSlice(blueprint);
}

export function siteInventory(blueprint: BrochureBlueprint = siteBlueprint()) {
  return readInventorySlice(blueprint);
}

export function siteNav(
  blueprint: BrochureBlueprint = siteBlueprint(),
): BrochureNavContent {
  const slice = blueprint.BrochureSiteNav_1;
  if (!slice || slice.component !== "BrochureSiteNav") {
    return emptyNavBlueprint();
  }
  const { component: _component, ...data } = slice;
  return data;
}

export function siteHashLinks(): BrochureNavLink[] {
  return [];
}

export function siteContact(
  blueprint: BrochureBlueprint = siteBlueprint(),
): BrochureContactContent | null {
  const slice = blueprint.BrochureContact_1;
  if (!slice || slice.component !== "BrochureContact") return null;
  const { component: _component, ...data } = slice;
  return data;
}

function instagramHrefFromLinks(
  links: { label: string; href: string }[] | undefined,
) {
  return (
    (links ?? []).find((link) =>
      `${link.label} ${link.href}`.toLowerCase().includes("instagram"),
    )?.href.trim() ?? ""
  );
}

export function siteChrome(blueprint: BrochureBlueprint = siteBlueprint()) {
  const nav = siteNav(blueprint);
  const contact = siteContact(blueprint);
  return {
    businessName: nav.businessName.trim() || "The Card Cave",
    description: nav.description.trim(),
    faviconUrl: nav.faviconUrl.trim(),
    shareImageUrl: nav.shareImageUrl.trim(),
    logoUrl: nav.logoImageUrl.trim(),
    email: contact?.email.trim() ?? "",
    whatsapp: contact?.whatsapp.trim() ?? "",
    instagram: instagramHrefFromLinks(contact?.links),
  };
}
