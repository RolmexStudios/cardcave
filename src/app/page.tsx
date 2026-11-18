"use client";

import { Contact } from "@/components/contacts";
import { Divider } from "@/components/dividers";
import { Hero } from "@/components/heroes";
import { SiteNav } from "@/components/navs";
import { Shop } from "@/components/shops";
import { SmoothScrollScope } from "@/components/shared/hash-link";
import { BrochureTree } from "@/lib/brochure/inject-instances";

export default function Home() {
  return (
    <BrochureTree>
      <SmoothScrollScope className="min-h-screen bg-[#faf8f5] text-[#1c1916]">
        <SiteNav />
        <main id="top">
          <Hero />
          <Divider />
          <Shop />
          <Contact />
        </main>
      </SmoothScrollScope>
    </BrochureTree>
  );
}
