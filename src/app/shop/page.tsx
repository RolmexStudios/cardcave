import type { Metadata } from "next";
import { siteChrome } from "@/lib/site-content";
import { ShopIndexLive } from "./live";

const chrome = siteChrome();

export const metadata: Metadata = {
  title: `The case — ${chrome.businessName}`,
  description:
    chrome.description ||
    "The current register of graded cards. Filter by year, brand, or sport.",
};

export default function ShopPage() {
  return <ShopIndexLive />;
}
