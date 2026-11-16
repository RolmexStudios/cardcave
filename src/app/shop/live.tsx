"use client";

import { ShowroomView } from "@/components/inventory/showroom-view";
import { useBrochureBlueprint } from "@/lib/admin/store";
import { siteChrome, siteInventory } from "@/lib/site-content";

export function ShopIndexLive() {
  const blueprint = useBrochureBlueprint();
  const content = siteInventory(blueprint);
  const chrome = siteChrome(blueprint);
  if (!content) {
    return null;
  }
  return (
    <ShowroomView
      content={content}
      businessName={chrome.businessName}
      logoUrl={chrome.logoUrl}
    />
  );
}
