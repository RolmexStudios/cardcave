"use client";

import { MediaSlot } from "@/components/shared/media";
import styles from "./image-marquee.module.scss";

export type ImageMarqueeSlide = {
  imageUrl: string;
  alt: string;
  slotId: string;
  jsonPath: string;
};

export type ImageMarqueeProps = {
  slides: ImageMarqueeSlide[];
  /** One full pass of the row, in milliseconds. */
  durationMs?: number;
  className?: string;
  itemClassName?: string;
  imageClassName?: string;
  /** Alternate a slight rotation so the row feels scattered, not gridded. */
  tilt?: boolean;
};

/**
 * Seamless horizontal loop. The row is painted twice and shifted by half
 * its width, which lands on the identical frame.
 */
export function ImageMarquee({
  slides,
  durationMs = 40000,
  className,
  itemClassName,
  imageClassName,
  tilt = false,
}: ImageMarqueeProps) {
  if (slides.length === 0) {
    return null;
  }

  const duration = Number.isFinite(durationMs) ? Math.max(1000, durationMs) : 40000;

  return (
    <div className={[styles.viewport, className].filter(Boolean).join(" ")}>
      <div
        className={styles.track}
        style={{ animationDuration: `${duration}ms` }}
      >
        {[0, 1].map((copy) =>
          slides.map((slide, index) => {
            const clone = copy === 1;
            return (
              <div
                key={`${copy}-${slide.slotId}-${index}`}
                className={[styles.item, itemClassName].filter(Boolean).join(" ")}
                data-clone={clone ? "" : undefined}
                data-tilt={tilt ? (index % 2 === 0 ? "a" : "b") : undefined}
                aria-hidden={clone ? true : undefined}
              >
                <MediaSlot
                  url={slide.imageUrl}
                  slotId={slide.slotId}
                  jsonPath={slide.jsonPath}
                  alt={clone ? "" : slide.alt}
                  className={[styles.image, imageClassName].filter(Boolean).join(" ")}
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
