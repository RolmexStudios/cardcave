import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { SiteRuntime } from "@/components/admin/site-runtime";
import { parseBrochureBlueprint } from "@/lib/brochure/schema";
import blueprintJson from "../../content/blueprint.json";
import siteJson from "../../content/site.json";
import "./globals.css";

const bundled = parseBrochureBlueprint(blueprintJson);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Card Cave",
  description: "Buy, sell, and trade graded sports cards in South Texas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteRuntime bundled={bundled} site={siteJson}>
          {children}
        </SiteRuntime>
      </body>
    </html>
  );
}
