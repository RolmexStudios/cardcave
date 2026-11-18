"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TextSlot } from "@/components/shared/text-slot";
import { MediaSlot } from "@/components/shared/media";
import { SectionHeading } from "@/components/shared/section-heading";
import { fieldPath } from "@/components/shared/field-path";
import { useSmoothHorizontalWheelScroll } from "@/components/shared/smooth-horizontal-wheel";
import { emptyInventoryBlueprint } from "@/components/inventory/blueprint";
import {
  hasSlabPhoto,
  indexedInventorySlabs,
  slabGradeLabel,
  slabHref,
  slabImagePath,
  slabTitle,
  type IndexedSlab,
} from "@/components/inventory/data";
import type {
  BrochureBlockProps,
  BrochureInventoryContent,
} from "@/types/brochure";
import styles from "./binder.module.scss";

const POCKETS = 9;

function pagesOf(rows: IndexedSlab[]): IndexedSlab[][] {
  if (rows.length === 0) return [];
  const pages: IndexedSlab[][] = [];
  for (let i = 0; i < rows.length; i += POCKETS) {
    pages.push(rows.slice(i, i + POCKETS));
  }
  return pages;
}

export function BinderInventory({
  instanceId = "BrochureInventory_1",
  data = emptyInventoryBlueprint(),
}: BrochureBlockProps<BrochureInventoryContent>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexed = useMemo(
    () => indexedInventorySlabs(data).filter(({ slab }) => hasSlabPhoto(slab)),
    [data],
  );
  const pages = useMemo(() => pagesOf(indexed), [indexed]);
  const looping = pages.length > 1;
  useSmoothHorizontalWheelScroll(trackRef, looping, { mapVertical: false });

  function step(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const page = track.querySelector<HTMLElement>(`.${styles.page}`);
    const distance = page ? page.offsetWidth + 24 : track.clientWidth * 0.85;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: distance * direction,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <section id={instanceId} className={styles.section} aria-label="Binder">
      <div className={styles.inner}>
        <header className={styles.header}>
          <SectionHeading
            instanceId={instanceId}
            eyebrow={data.eyebrow}
            title={data.title}
            eyebrowClassName={styles.eyebrow}
            titleClassName={styles.title}
          />
          <div className={styles.aside}>
            {data.intro.trim() ? (
              <TextSlot
                value={data.intro}
                jsonPath={fieldPath(instanceId, "intro")}
                as="p"
                className={styles.intro}
              />
            ) : null}
            {pages.length > 1 ? (
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.control}
                  onClick={() => step(-1)}
                  aria-label="Previous page"
                >
                  <ArrowLeft aria-hidden />
                </button>
                <button
                  type="button"
                  className={styles.control}
                  onClick={() => step(1)}
                  aria-label="Next page"
                >
                  <ArrowRight aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        </header>
      </div>

      <div ref={trackRef} className={styles.track} data-smooth-wheel="">
        {pages.map((page, pageIndex) => (
          <article
            key={`page-${pageIndex}`}
            className={styles.page}
            aria-label={`Page ${pageIndex + 1} of ${pages.length}`}
          >
            <span className={styles.rings} aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <p className={styles.folio}>
              {pageIndex + 1} / {pages.length}
            </p>
            <ul className={styles.pockets}>
              {Array.from({ length: POCKETS }, (_, pocket) => {
                const row = page[pocket];
                if (!row) {
                  return (
                    <li key={`empty-${pocket}`} className={styles.pocket}>
                      <span className={styles.emptyFace} aria-hidden />
                    </li>
                  );
                }
                const title = slabTitle(row.slab) || "Card";
                const grade = slabGradeLabel(row.slab);
                return (
                  <li key={row.slab.id || `${instanceId}-${row.index}`}>
                    <Link
                      href={slabHref(row.slab)}
                      className={styles.pocket}
                      aria-label={title}
                    >
                      <span className={styles.face}>
                        <MediaSlot
                          url={row.slab.imageUrl}
                          slotId={`${instanceId}_${row.index + 1}`}
                          jsonPath={slabImagePath(instanceId, row)}
                          alt={row.slab.imageAlt.trim() || title}
                          className={styles.image}
                        />
                      </span>
                      <span className={styles.caption}>
                        <span className={styles.player}>{row.slab.player}</span>
                        {grade ? <span className={styles.grade}>{grade}</span> : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
