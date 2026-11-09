"use client";

import { About } from "@/components/abouts";
import { Contact } from "@/components/contacts";
import { Footer } from "@/components/footers";
import { Hero } from "@/components/heroes";
import { SiteNav } from "@/components/navs";
import { Shop } from "@/components/shops";
import { SmoothScrollScope } from "@/components/shared/hash-link";
import { injectBrochureInstances } from "@/lib/brochure/inject-instances";
import { parseBrochureBlueprint } from "@/lib/brochure/schema";
import blueprintJson from "../../content/blueprint.json";

export default function Home() {
  const blueprint = parseBrochureBlueprint(blueprintJson);
  return injectBrochureInstances(
    <SmoothScrollScope className="min-h-screen bg-[#faf8f5] text-[#1c1916]">
      <SiteNav />
      <main id="top">
        <Hero />
        <Shop />
        <About />
        <Contact />
      </main>
      <Footer />
    </SmoothScrollScope>,
    blueprint,
  );
}
