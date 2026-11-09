import type { Metadata } from "next";
import { ShowroomView } from "@/components/inventory/showroom-view";
import { siteChrome, siteInventory } from "@/lib/site-content";

const chrome = siteChrome();

export const metadata: Metadata = {
  title: `The case — ${chrome.businessName}`,
  description:
    chrome.description ||
    "The current register of graded cards. Filter by year, brand, or sport.",
};

export default function ShopPage() {
  const content = siteInventory();
  if (!content) {
    return null;
  }
  return (
    <ShowroomView
      content={content}
      businessName={chrome.businessName}
      logoUrl={chrome.logoUrl}
    />
  );
}
