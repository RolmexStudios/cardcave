import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleView } from "@/components/inventory/vehicle-view";
import {
  getAllInventoryVehicles,
  getVehicleBySlug,
  vehicleSlug,
  vehicleTitle,
} from "@/components/inventory/data";
import { siteBlueprint, siteChrome } from "@/lib/site-content";

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
    return { title: `The case — ${chrome.businessName}` };
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
  const chrome = siteChrome();
  const { slug } = await params;
  const vehicle = getVehicleBySlug(siteBlueprint(), slug);
  if (!vehicle) {
    notFound();
  }
  return (
    <VehicleView
      vehicle={vehicle}
      businessName={chrome.businessName}
      logoUrl={chrome.logoUrl}
      inquiryEmail={chrome.email}
      whatsapp={chrome.whatsapp}
    />
  );
}
