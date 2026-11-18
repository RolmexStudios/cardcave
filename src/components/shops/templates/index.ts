import type { ComponentType } from "react";
import type {
  BrochureBlockProps,
  BrochureShopContent,
  BrochureShopVariant,
} from "@/types/brochure";
import { GalleryShop } from "@/components/shops/templates/gallery/GalleryShop";
import { RailShop } from "@/components/shops/templates/rail/RailShop";
import { CardsShop } from "@/components/shops/templates/cards/CardsShop";

export type ShopTemplateComponent = ComponentType<
  BrochureBlockProps<BrochureShopContent>
>;

export const shopTemplates: Record<BrochureShopVariant, ShopTemplateComponent> = {
  rail: RailShop,
  gallery: GalleryShop,
  cards: CardsShop,
};
