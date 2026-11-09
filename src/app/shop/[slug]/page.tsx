import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/shops/product-view";
import { SHOP_INSTANCE_ID, shopSlug } from "@/components/shops/data";
import { StudioChrome } from "@/components/navs/templates/studio/StudioNav";
import {
  siteChrome,
  siteContact,
  siteHashLinks,
  siteNav,
  siteShop,
} from "@/lib/site-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  const content = siteShop();
  if (!content) return [];
  const seen = new Set<string>();
  const params: { slug: string }[] = [];
  for (const item of content.items) {
    const slug = shopSlug(item);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    params.push({ slug });
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const chrome = siteChrome();
  const { slug } = await params;
  const content = siteShop();
  const item = content?.items.find((entry) => shopSlug(entry) === slug);
  if (!item) return { title: `Shop — ${chrome.businessName}` };
  const name = [item.brand.trim(), item.title.trim()].filter(Boolean).join(" ");
  return {
    title: `${name || "Piece"} — ${chrome.businessName}`,
    description: item.description.trim() || name || chrome.description,
  };
}

export default async function ShopItemPage({ params }: PageProps) {
  const { slug } = await params;
  const content = siteShop();
  const index = content?.items.findIndex((item) => shopSlug(item) === slug) ?? -1;
  if (!content || index < 0) notFound();
  const item = content.items[index];
  const contact = siteContact();
  const email = contact?.email.trim() ?? "";
  const subject = item.title.trim() || item.brand.trim() || "A piece";
  const inquiryHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : "";

  return (
    <StudioChrome nav={siteNav()} hashLinks={siteHashLinks()}>
      <main>
        <ProductView
          item={item}
          index={index}
          instanceId={SHOP_INSTANCE_ID}
          inquiryHref={inquiryHref}
          inquiryLabel={contact?.ctaLabel.trim() || "Ask about this piece"}
        />
      </main>
    </StudioChrome>
  );
}
