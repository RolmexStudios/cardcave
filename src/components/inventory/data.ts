import inventoryJson from "./blueprint.json";
import { inventoryBlueprintSchema } from "@/components/inventory/blueprint";
import type {
  BrochureInventoryContent,
  BrochureSlab,
  BrochureSlabStatus,
  BrochureVehicle,
  BrochureVehicleStatus,
} from "@/types/brochure";

/** Default instance id for the showroom block in both demo and produced sites. */
export const INVENTORY_INSTANCE_ID = "BrochureInventory_1";

export const VEHICLE_STATUS_LABELS: Record<BrochureVehicleStatus, string> = {
  available: "Available",
  incoming: "Arriving",
  private: "Private sale",
  sold: "Sold",
};

/** Cars still on offer. Sold records stay off the teaser and showroom grid. */
export function isListedVehicle(vehicle: BrochureVehicle): boolean {
  return vehicle.status !== "sold";
}

/** Stable slug from the vehicle id — never from translated or edited titles. */
export function slugifyVehicleId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function vehicleSlug(vehicle: BrochureVehicle): string {
  return vehicle.slug.trim() || slugifyVehicleId(vehicle.id);
}

export function showroomHref(): string {
  return "/shop";
}

export function vehicleHref(vehicle: BrochureVehicle): string {
  return `/shop/${vehicleSlug(vehicle)}`;
}

export function vehicleTitle(vehicle: BrochureVehicle): string {
  return [vehicle.year, vehicle.make, vehicle.model]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function vehicleCoverUrl(vehicle: {
  imageUrl: string;
  galleryImageUrls: string[];
}): string {
  return (
    vehicle.imageUrl.trim() ||
    vehicle.galleryImageUrls.find((url) => url.trim())?.trim() ||
    ""
  );
}

export const SLAB_STATUS_LABELS: Record<BrochureSlabStatus, string> = {
  available: "Available",
  hold: "On hold",
  traded: "Traded",
  sold: "Sold",
};

export function isListedSlab(slab: BrochureSlab): boolean {
  return slab.status !== "sold" && slab.status !== "traded";
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function isPrintRun(value: string): boolean {
  const trimmed = value.trim();
  return /^\/\d+$/.test(trimmed) || /^\d+\s*\/\s*\d+$/.test(trimmed);
}

function parseGradeParts(value: string): { grader: string; grade: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(PSA|BGS|CGC|SGC|RAW)\s*(.*)$/i);
  if (!match) {
    return { grader: "", grade: trimmed };
  }
  const tag = match[1].toUpperCase();
  const remainder = match[2].trim();
  return {
    grader: tag === "RAW" ? "Raw" : tag,
    grade: isPrintRun(remainder) ? "" : remainder,
  };
}

export function vehicleToSlab(vehicle: BrochureVehicle): BrochureSlab {
  const parsed = parseGradeParts(vehicle.metricValue);
  const status: BrochureSlabStatus =
    vehicle.status === "sold"
      ? "sold"
      : vehicle.status === "incoming"
        ? "hold"
        : "available";
  return {
    id: vehicle.id,
    slug: vehicle.slug,
    year: vehicle.year,
    set: vehicle.make,
    player: vehicle.model,
    parallel: "",
    sport: vehicle.transmission,
    grader: parsed.grader,
    grade: parsed.grade || (parsed.grader === "Raw" ? "Raw" : vehicle.metricValue),
    cert: vehicle.chassis,
    band: vehicle.placedNote,
    status,
    price: vehicle.price,
    imageUrl: vehicleCoverUrl(vehicle),
    imageAlt: vehicle.imageAlt,
    galleryImageUrls: vehicle.galleryImageUrls,
    backImageUrl: vehicle.backImageUrl,
    backImageAlt: vehicle.backImageAlt,
    backText: vehicle.backText,
    description: vehicle.description,
  };
}

/** Prefer authored slabs; otherwise map the car register so older blueprints still render. */
export function inventorySlabs(data: BrochureInventoryContent): BrochureSlab[] {
  if (data.items.some((item) => item.id.trim() || item.imageUrl.trim() || item.player.trim())) {
    return data.items;
  }
  return data.vehicles.map(vehicleToSlab);
}

export type IndexedSlab = {
  slab: BrochureSlab;
  index: number;
  source: "items" | "vehicles";
};

export function indexedInventorySlabs(
  data: BrochureInventoryContent,
): IndexedSlab[] {
  const authored = data.items.some(
    (item) => item.id.trim() || item.imageUrl.trim() || item.player.trim(),
  );
  if (authored) {
    return data.items.map((slab, index) => ({
      slab,
      index,
      source: "items" as const,
    }));
  }
  return data.vehicles.map((vehicle, index) => ({
    slab: vehicleToSlab(vehicle),
    index,
    source: "vehicles" as const,
  }));
}

export function slabSlug(slab: BrochureSlab): string {
  return slab.slug.trim() || slugifyVehicleId(slab.id);
}

export function slabHref(slab: BrochureSlab): string {
  return `${showroomHref()}/${slabSlug(slab)}`;
}

export function slabTitle(slab: BrochureSlab): string {
  return [slab.year, slab.player, slab.parallel || slab.set]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function slabGradeLabel(slab: BrochureSlab): string {
  return [slab.grader, slab.grade].map((part) => part.trim()).filter(Boolean).join(" ");
}

export function slabImagePath(
  instanceId: string,
  row: IndexedSlab,
): string {
  return `${instanceId}.${row.source}[${row.index}].imageUrl`;
}

type BlueprintLike = Record<string, unknown> | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse the inventory slice out of a full blueprint object (produced-site content). */
export function readInventorySlice(
  blueprint: BlueprintLike,
  instanceId: string = INVENTORY_INSTANCE_ID,
): BrochureInventoryContent | null {
  if (!isRecord(blueprint)) {
    return null;
  }
  const raw = blueprint[instanceId];
  if (!isRecord(raw)) {
    return null;
  }
  const fields = { ...raw };
  delete fields.component;
  return inventoryBlueprintSchema.parse(fields);
}

export function getInventoryVehicles(
  blueprint: BlueprintLike,
  instanceId: string = INVENTORY_INSTANCE_ID,
): BrochureVehicle[] {
  return readInventorySlice(blueprint, instanceId)?.vehicles ?? [];
}

/** Every inventory slice in a blueprint (showroom, teaser, archive). */
export function listInventoryInstanceIds(blueprint: BlueprintLike): string[] {
  if (!isRecord(blueprint)) {
    return [];
  }
  return Object.keys(blueprint).filter((key) => {
    const raw = blueprint[key];
    return isRecord(raw) && raw.component === "BrochureInventory";
  });
}

/** Listed and sold cars, first unique slug wins. */
export function getAllInventoryVehicles(
  blueprint: BlueprintLike,
): BrochureVehicle[] {
  const seen = new Set<string>();
  const vehicles: BrochureVehicle[] = [];
  for (const instanceId of listInventoryInstanceIds(blueprint)) {
    for (const vehicle of getInventoryVehicles(blueprint, instanceId)) {
      const slug = vehicleSlug(vehicle);
      if (!slug || seen.has(slug)) {
        continue;
      }
      seen.add(slug);
      vehicles.push(vehicle);
    }
  }
  return vehicles;
}

export function getVehicleBySlug(
  blueprint: BlueprintLike,
  slug: string,
  instanceId?: string,
): BrochureVehicle | undefined {
  const vehicles = instanceId
    ? getInventoryVehicles(blueprint, instanceId)
    : getAllInventoryVehicles(blueprint);
  return vehicles.find((vehicle) => vehicleSlug(vehicle) === slug);
}

/** Demo convenience: the block's own sample fiction (no scrape, no content file). */
export function getSampleInventory(): BrochureInventoryContent {
  return inventoryBlueprintSchema.parse(inventoryJson);
}

export function getSampleVehicles(): BrochureVehicle[] {
  return getSampleInventory().vehicles;
}
