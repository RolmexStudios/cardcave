import type { ComponentType } from "react";
import type {
  BrochureBlockProps,
  BrochureInventoryContent,
  BrochureInventoryVariant,
} from "@/types/brochure";
import { ShowroomInventory } from "@/components/inventory/templates/showroom/ShowroomInventory";
import { ArchiveInventory } from "@/components/inventory/templates/archive/ArchiveInventory";
import { TeaserInventory } from "@/components/inventory/templates/teaser/TeaserInventory";
import { CaseInventory } from "@/components/inventory/templates/case/CaseInventory";
import { BinderInventory } from "@/components/inventory/templates/binder/BinderInventory";
import { VaultInventory } from "@/components/inventory/templates/vault/VaultInventory";
import { CardsInventory } from "@/components/inventory/templates/cards/CardsInventory";

export type InventoryTemplateComponent = ComponentType<
  BrochureBlockProps<BrochureInventoryContent>
>;

export const inventoryTemplates: Record<
  BrochureInventoryVariant,
  InventoryTemplateComponent
> = {
  showroom: ShowroomInventory,
  teaser: TeaserInventory,
  archive: ArchiveInventory,
  case: CaseInventory,
  binder: BinderInventory,
  vault: VaultInventory,
  cards: CardsInventory,
};
