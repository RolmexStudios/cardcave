"use client";

import { ShowroomChrome } from "@/components/inventory/page-chrome";
import { inventoryTemplates } from "@/components/inventory/templates";
import { INVENTORY_INSTANCE_ID } from "@/components/inventory/data";
import type {
  BrochureInventoryContent,
  BrochureInventoryVariant,
} from "@/types/brochure";

export type ShowroomViewProps = {
  content: BrochureInventoryContent;
  businessName: string;
  logoUrl?: string;
  instanceId?: string;
};

/** Home teaser/archive stay on the home page; the index route uses a catalog layout. */
function catalogIndexVariant(
  variant: BrochureInventoryVariant,
): BrochureInventoryVariant {
  if (variant === "teaser" || variant === "archive") {
    return "showroom";
  }
  return variant;
}

/** Full catalog page: shared across the demo route and produced sites. */
export function ShowroomView({
  content,
  businessName,
  logoUrl,
  instanceId = INVENTORY_INSTANCE_ID,
}: ShowroomViewProps) {
  const variant = catalogIndexVariant(content.variant);
  const Template = inventoryTemplates[variant] ?? inventoryTemplates.showroom;
  return (
    <ShowroomChrome businessName={businessName} logoUrl={logoUrl}>
      <Template
        instanceId={instanceId}
        data={{ ...content, variant, sectionSize: "auto" }}
      />
    </ShowroomChrome>
  );
}
