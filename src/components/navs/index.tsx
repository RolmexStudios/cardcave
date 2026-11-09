import { emptyNavBlueprint } from "@/components/navs/blueprint";
import { navTemplates } from "@/components/navs/templates";
import { FloatingCta } from "@/components/shared/floating-cta";
import { brochureContactHref } from "@/components/navs/links";
import type { BrochureBlockProps, BrochureNavContent } from "@/types/brochure";

export function SiteNav({
  instanceId = "BrochureSiteNav_1",
  data = emptyNavBlueprint(),
}: BrochureBlockProps<BrochureNavContent>) {
  const Template = navTemplates[data.variant] ?? navTemplates.bar;
  const contactHref = brochureContactHref(data.links);
  return (
    <>
      <Template instanceId={instanceId} data={data} />
      {data.variant === "editorial" ||
      data.variant === "runway" ||
      data.variant === "studio" ? null : (
        <FloatingCta href={contactHref} label="Buy, sell, or trade" />
      )}
    </>
  );
}

SiteNav.displayName = "BrochureSiteNav";

export const BrochureSiteNav = SiteNav;
