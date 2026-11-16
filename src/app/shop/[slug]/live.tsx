"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { VehicleView } from "@/components/inventory/vehicle-view";
import { getVehicleBySlug } from "@/components/inventory/data";
import { useBrochureBlueprint } from "@/lib/admin/store";
import { siteChrome } from "@/lib/site-content";

export function ShopSlugLive({ slug: slugProp }: { slug?: string } = {}) {
  const params = useParams<{ slug?: string }>();
  const pathname = usePathname();
  const slug =
    slugProp ??
    params.slug ??
    pathname.split("/").filter(Boolean).pop() ??
    "";
  const blueprint = useBrochureBlueprint();
  const chrome = siteChrome(blueprint);
  const vehicle = getVehicleBySlug(blueprint, slug);
  if (!vehicle) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p>This slab isn’t in the case.</p>
        <Link href="/shop" className="underline underline-offset-4">
          Back to the case
        </Link>
      </main>
    );
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
