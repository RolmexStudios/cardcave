import shopJson from "./blueprint.json";
import { shopBlueprintSchema } from "@/components/shops/blueprint";
import type {
  BrochureShopContent,
  BrochureShopItem,
} from "@/types/brochure";

export const SHOP_INSTANCE_ID = "BrochureShop_1";

export function isListedItem(item: BrochureShopItem): boolean {
  return item.status !== "sold";
}

export function shopSlug(item: BrochureShopItem): string {
  return (item.slug.trim() || item.id.trim())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function shopHref(): string {
  return "/shop";
}

export function shopCategorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function shopCategoryHref(name: string): string {
  const slug = shopCategorySlug(name);
  return slug ? `${shopHref()}?category=${encodeURIComponent(slug)}` : shopHref();
}

export type ShopCategoryPhoto = {
  src: string;
  alt: string;
};

export type ShopCategoryGroup = {
  name: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
  count: number;
  /** Cover of each listed piece first, then extra frames, capped. */
  photos: ShopCategoryPhoto[];
};

const CATEGORY_STACK_LIMIT = 8;

function pushCategoryPhoto(
  group: ShopCategoryGroup,
  src: string,
  alt: string,
) {
  if (group.photos.length >= CATEGORY_STACK_LIMIT) return;
  if (group.photos.some((photo) => photo.src === src)) return;
  group.photos.push({ src, alt: alt.trim() || group.name });
}

/** Listed pieces, in blueprint order, grouped by the first time each category appears. */
export function shopCategoryGroups(items: BrochureShopItem[]): ShopCategoryGroup[] {
  const groups = new Map<
    string,
    { group: ShopCategoryGroup; pending: BrochureShopItem[] }
  >();
  for (const item of items) {
    if (!isListedItem(item)) continue;
    const name = item.category.trim();
    const slug = shopCategorySlug(name);
    if (!slug) continue;
    const existing = groups.get(slug);
    if (existing) {
      existing.group.count += 1;
      existing.pending.push(item);
      continue;
    }
    groups.set(slug, {
      group: {
        name,
        slug,
        imageUrl: item.imageUrl.trim(),
        imageAlt: item.imageAlt.trim() || name,
        count: 1,
        photos: [],
      },
      pending: [item],
    });
  }

  for (const { group, pending } of groups.values()) {
    for (const item of pending) {
      const [cover] = shopPhotos(item);
      if (!cover) continue;
      pushCategoryPhoto(
        group,
        cover,
        item.imageAlt.trim() || item.title.trim() || group.name,
      );
    }
    for (const item of pending) {
      for (const src of shopPhotos(item).slice(1)) {
        pushCategoryPhoto(group, src, item.title.trim() || group.name);
      }
    }
  }

  return [...groups.values()].map(({ group }) => group);
}

export function shopItemHref(item: BrochureShopItem): string {
  const slug = shopSlug(item);
  return slug ? `${shopHref()}/${slug}` : shopHref();
}

/** Cover first, then any extra frames, dropping blanks and repeats. */
export function shopPhotos(item: BrochureShopItem): string[] {
  const seen = new Set<string>();
  const photos: string[] = [];
  for (const url of [item.imageUrl, ...item.images]) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    photos.push(trimmed);
  }
  return photos;
}

export function shopParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

type BlueprintLike = Record<string, unknown> | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readShopSlice(
  blueprint: BlueprintLike,
  instanceId: string = SHOP_INSTANCE_ID,
): BrochureShopContent | null {
  if (!isRecord(blueprint)) return null;
  const raw = blueprint[instanceId];
  if (!isRecord(raw)) return null;
  const fields = { ...raw };
  delete fields.component;
  return shopBlueprintSchema.parse(fields);
}

export function getSampleShop(): BrochureShopContent {
  return shopBlueprintSchema.parse(shopJson);
}
