"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TextSlot } from "@/components/shared/text-slot";
import { MediaSlot } from "@/components/shared/media";
import { SectionHeading } from "@/components/shared/section-heading";
import { fieldPath } from "@/components/shared/field-path";
import { emptyInventoryBlueprint } from "@/components/inventory/blueprint";
import { ChipRow } from "@/components/inventory/templates/chip-row";
import {
  collectFilterYears,
  matchesYearFilter,
} from "@/components/shared/year-range";
import {
  hasSlabPhoto,
  indexedInventorySlabs,
  isListedSlab,
  publicItemPrice,
  slabGradeLabel,
  slabHref,
  slabImagePath,
  slabTitle,
  slabYearLabel,
  uniqueSorted,
} from "@/components/inventory/data";
import type {
  BrochureBlockProps,
  BrochureInventoryContent,
} from "@/types/brochure";
import styles from "./case.module.scss";

const ALL = "all";

type FilterState = {
  sport: string;
  year: string;
  set: string;
  grade: string;
};

const EMPTY_FILTERS: FilterState = {
  sport: ALL,
  year: ALL,
  set: ALL,
  grade: ALL,
};

export function CaseInventory({
  instanceId = "BrochureInventory_1",
  data = emptyInventoryBlueprint(),
}: BrochureBlockProps<BrochureInventoryContent>) {
  const indexed = useMemo(
    () =>
      indexedInventorySlabs(data).filter(
        ({ slab }) => isListedSlab(slab) && hasSlabPhoto(slab),
      ),
    [data],
  );
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const sports = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slab.sport)),
    [indexed],
  );
  const years = useMemo(
    () => collectFilterYears(indexed.map(({ slab }) => slab)),
    [indexed],
  );
  const sets = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slab.set)),
    [indexed],
  );
  const grades = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slabGradeLabel(slab))),
    [indexed],
  );

  const filtered = useMemo(
    () =>
      indexed.filter(({ slab }) => {
        if (filters.sport !== ALL && slab.sport.trim() !== filters.sport) {
          return false;
        }
        if (!matchesYearFilter(slab, filters.year)) {
          return false;
        }
        if (filters.set !== ALL && slab.set.trim() !== filters.set) {
          return false;
        }
        if (
          filters.grade !== ALL &&
          slabGradeLabel(slab) !== filters.grade
        ) {
          return false;
        }
        return true;
      }),
    [indexed, filters],
  );

  const hasActive =
    filters.sport !== ALL ||
    filters.year !== ALL ||
    filters.set !== ALL ||
    filters.grade !== ALL;

  const countLabel =
    filtered.length === indexed.length
      ? `${indexed.length} slabs`
      : `${filtered.length} of ${indexed.length}`;

  return (
    <section id={instanceId} className={styles.section} aria-label="The case">
      <div className={styles.inner}>
        <header className={styles.header}>
          <SectionHeading
            instanceId={instanceId}
            eyebrow={data.eyebrow}
            title={data.title}
            eyebrowClassName={styles.eyebrow}
            titleClassName={styles.title}
          />
          {data.intro.trim() ? (
            <TextSlot
              value={data.intro}
              jsonPath={fieldPath(instanceId, "intro")}
              as="p"
              className={styles.intro}
            />
          ) : null}
          <p className={styles.count} aria-live="polite">
            {countLabel}
          </p>
        </header>

        <div className={styles.filters} aria-label="Filter the case">
          <ChipRow
            label="Sport"
            value={filters.sport}
            options={sports}
            onChange={(value) => setFilters((current) => ({ ...current, sport: value }))}
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          <ChipRow
            label="Year"
            value={filters.year}
            options={years}
            onChange={(value) => setFilters((current) => ({ ...current, year: value }))}
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          <ChipRow
            label="Set"
            value={filters.set}
            options={sets}
            onChange={(value) => setFilters((current) => ({ ...current, set: value }))}
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          <ChipRow
            label="Grade"
            value={filters.grade}
            options={grades}
            onChange={(value) => setFilters((current) => ({ ...current, grade: value }))}
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          <button
            type="button"
            className={styles.reset}
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={!hasActive}
          >
            Reset
          </button>
        </div>

        {filtered.length > 0 ? (
          <ul className={styles.grid}>
            {filtered.map((row) => {
              const title = slabTitle(row.slab) || "Slab";
              const grade = slabGradeLabel(row.slab);
              const price = publicItemPrice(row.slab.price, data, row.slab);
              return (
                <li key={row.slab.id || `${instanceId}-${row.index}`}>
                  <Link
                    href={slabHref(row.slab)}
                    className={styles.tile}
                    aria-label={`${title}${price ? ` — ${price}` : ""}`}
                  >
                    <figure className={styles.well}>
                      <MediaSlot
                        url={row.slab.imageUrl}
                        slotId={`${instanceId}_${row.index + 1}`}
                        jsonPath={slabImagePath(instanceId, row)}
                        alt={row.slab.imageAlt.trim() || title}
                        className={styles.image}
                      />
                      {grade ? <span className={styles.badge}>{grade}</span> : null}
                    </figure>
                    <div className={styles.meta}>
                      <p className={styles.kicker}>
                        {[slabYearLabel(row.slab), row.slab.sport]
                          .filter((part) => part.trim())
                          .join(" · ")}
                      </p>
                      <h3 className={styles.player}>{row.slab.player}</h3>
                      <p className={styles.line}>
                        {[row.slab.set, row.slab.parallel]
                          .filter((part) => part.trim())
                          .join(" · ")}
                      </p>
                      {price ? (
                      <p className={styles.price}>
                        {price}
                      </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.empty} role="status">
            <p>Nothing in the case matches that.</p>
            <button
              type="button"
              className={styles.emptyReset}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
