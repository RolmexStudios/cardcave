import type { Metadata } from "next";
import {
  getAllInventoryVehicles,
  getVehicleBySlug,
  vehicleSlug,
  vehicleTitle,
} from "@/components/inventory/data";
import { siteBlueprint, siteChrome } from "@/lib/site-content";
import { ShopSlugLive } from "./live";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllInventoryVehicles(siteBlueprint())
    .map((vehicle) => vehicleSlug(vehicle))
    .filter(Boolean)
    .map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const chrome = siteChrome();
  const { slug } = await params;
  const vehicle = getVehicleBySlug(siteBlueprint(), slug);
  if (!vehicle) {
    return { title: `Inventory — ${chrome.businessName}` };
  }
  return {
    title: `${vehicleTitle(vehicle)} — ${chrome.businessName}`,
    description:
      vehicle.status === "sold"
        ? `${vehicleTitle(vehicle)} — sold.`
        : vehicle.imageAlt || `${vehicleTitle(vehicle)}, offered privately.`,
  };
}

export default async function ShopItemPage({ params }: PageProps) {
  const { slug } = await params;
  return <ShopSlugLive slug={slug} />;
}
