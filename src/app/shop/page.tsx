import type { Metadata } from "next";
import { siteChrome } from "@/lib/site-content";
import { ShopIndexLive } from "./live";

const chrome = siteChrome();

export const metadata: Metadata = {
  title: `Inventory — ${chrome.businessName}`,
  description:
    chrome.description ||
    "The current register of graded cards. Filter by sport, grading company, grade, or availability.",
};

export default function ShopPage() {
  return <ShopIndexLive />;
}
