"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HashLink } from "@/components/shared/hash-link";
import { ImageMarquee } from "@/components/shared/image-marquee";
import { TextSlot } from "@/components/shared/text-slot";
import { fieldPath } from "@/components/shared/field-path";
import { marqueeHeroBlueprintSchema } from "@/components/heroes/templates/marquee/blueprint";
import type {
  BrochureBlockProps,
  BrochureHeroContent,
  BrochureHeroMarqueeContent,
} from "@/types/brochure";
import styles from "./marquee.module.scss";

const EMPTY: BrochureHeroMarqueeContent = marqueeHeroBlueprintSchema.parse({
  variant: "marquee",
});

function MarqueeCta({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith("#")) {
    return (
      <HashLink href={href} className={className}>
        {children}
      </HashLink>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return <span className={className}>{children}</span>;
}

/** Centered introduction over a drifting row of portraits. */
export function MarqueeHero({
  instanceId = "BrochureHero_1",
  data,
}: BrochureBlockProps<BrochureHeroContent>) {
  const hero: BrochureHeroMarqueeContent =
    data?.variant === "marquee" ? data : EMPTY;
  const headline = hero.headline.trim();
  const words = headline ? headline.split(/\s+/) : [];
  const ctaLabel = hero.ctaLabel.trim();
  const ctaHref = hero.ctaHref.trim();

  return (
    <section id={instanceId} className={styles.root} aria-label="Introduction">
      <div className={styles.copy}>
        <TextSlot
          value={hero.eyebrow}
          jsonPath={fieldPath(instanceId, "eyebrow")}
          as="p"
          className={styles.eyebrow}
          hideWhenEmpty
        />

        {words.length > 0 ? (
          <h1 className={styles.headline}>
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={styles.word}
                style={{ animationDelay: `${0.08 + index * 0.1}s` }}
              >
                {word}
              </span>
            ))}
          </h1>
        ) : (
          <TextSlot
            value={hero.headline}
            jsonPath={fieldPath(instanceId, "headline")}
            as="h1"
            className={styles.headline}
          />
        )}

        <TextSlot
          value={hero.subheadline}
          jsonPath={fieldPath(instanceId, "subheadline")}
          as="p"
          className={styles.subheadline}
        />

        {ctaLabel ? (
          <div className={styles.ctaReveal}>
            <MarqueeCta href={ctaHref} className={styles.cta}>
              {ctaLabel}
            </MarqueeCta>
          </div>
        ) : null}
      </div>

      <div className={styles.band}>
        <ImageMarquee
          slides={hero.slideshowImages.map((slide, index) => ({
            imageUrl: slide.imageUrl,
            alt: slide.alt,
            slotId: `${instanceId}-marquee-${index}`,
            jsonPath: fieldPath(instanceId, `slideshowImages.${index}.imageUrl`),
          }))}
          durationMs={hero.marqueeDurationMs}
          tilt
          itemClassName={styles.card}
          imageClassName={styles.photo}
        />
      </div>
    </section>
  );
}
