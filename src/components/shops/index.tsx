"use client";

import { BrochureBlock } from "@/components/shared/brochure-block";
import { emptyShopBlueprint } from "@/components/shops/blueprint";
import { shopTemplates } from "@/components/shops/templates";
import type { BrochureBlockProps, BrochureShopContent } from "@/types/brochure";

export function Shop({
  instanceId = "BrochureShop_1",
  data = emptyShopBlueprint(),
}: BrochureBlockProps<BrochureShopContent>) {
  const variant = data.variant === "gallery" ? "gallery" : "cards";
  const Template = shopTemplates[variant] ?? shopTemplates.cards;
  return (
    <BrochureBlock instanceId={instanceId} size={data.sectionSize} reveal={false}>
      <Template instanceId={instanceId} data={data} />
    </BrochureBlock>
  );
}

Shop.displayName = "BrochureShop";

export const BrochureShop = Shop;
