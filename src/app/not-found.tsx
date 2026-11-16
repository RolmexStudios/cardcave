"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVehicleBySlug } from "@/components/inventory/data";
import { useBrochureStore } from "@/lib/admin/store";
import { ShopSlugLive } from "./shop/[slug]/live";

export default function NotFound() {
  const pathname = usePathname();
  const store = useBrochureStore();
  if (!store?.liveReady) {
    return null;
  }
  const match = pathname.match(/^\/shop\/([^/]+)\/?$/);
  const slug = match?.[1] ?? "";
  if (slug && getVehicleBySlug(store.blueprint, slug)) {
    return <ShopSlugLive slug={slug} />;
  }
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p>This page isn’t here.</p>
      <Link href="/shop" className="underline underline-offset-4">
        Back to the case
      </Link>
    </main>
  );
}
