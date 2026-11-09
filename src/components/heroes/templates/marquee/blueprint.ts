import { z } from "zod";
import { heroSectionSizeSchema } from "@/components/shared/section-size";

const MARQUEE_SCAFFOLD_COUNT = 6;

const marqueeImageSchema = z.object({
  imageUrl: z.string().default(""),
  alt: z.string().default(""),
});

/**
 * Marquee hero: centered introduction, a red pill button, and a looping
 * row of portrait photographs along the bottom.
 */
export const marqueeHeroBlueprintSchema = z.object({
  variant: z.literal("marquee"),
  eyebrow: z.string().default(""),
  headline: z.string().default(""),
  subheadline: z.string().default(""),
  ctaLabel: z.string().default("Get Started"),
  /** Where the pill button goes. Empty renders the label without a link. */
  ctaHref: z.string().default(""),
  sectionSize: heroSectionSizeSchema,
  /** Milliseconds for one pass of the portrait row. */
  marqueeDurationMs: z.number().int().min(8000).max(120000).default(40000),
  slideshowImages: z
    .array(marqueeImageSchema)
    .default(
      Array.from({ length: MARQUEE_SCAFFOLD_COUNT }, () => ({
        imageUrl: "",
        alt: "",
      })),
    ),
});
