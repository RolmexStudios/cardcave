import { Suspense } from "react";
import type { Metadata } from "next";
import { Shop } from "@/components/shops";
import { SHOP_INSTANCE_ID } from "@/components/shops/data";
import { StudioChrome } from "@/components/navs/templates/studio/StudioNav";
import { siteChrome, siteHashLinks, siteNav, siteShop } from "@/lib/site-content";

const chrome = siteChrome();

export const metadata: Metadata = {
  title: `Shop — ${chrome.businessName}`,
  description: chrome.description || `Pieces available from ${chrome.businessName}.`,
};

export default function ShopPage() {
  const content = siteShop();
  if (!content) return null;
  return (
    <StudioChrome nav={siteNav()} hashLinks={siteHashLinks()}>
      <main>
        <Suspense>
          <Shop
            instanceId={SHOP_INSTANCE_ID}
            data={{ ...content, variant: "gallery", sectionSize: "auto" }}
          />
        </Suspense>
      </main>
    </StudioChrome>
  );
}
