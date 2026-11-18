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
import styles from "./vault.module.scss";

const ALL = "all";

type FilterState = {
  sport: string;
  year: string;
  set: string;
};

const EMPTY_FILTERS: FilterState = {
  sport: ALL,
  year: ALL,
  set: ALL,
};

export function VaultInventory({
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
        return true;
      }),
    [indexed, filters],
  );

  const hasActive =
    filters.sport !== ALL || filters.year !== ALL || filters.set !== ALL;

  return (
    <section id={instanceId} className={styles.section} aria-label="The vault">
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
        </header>

        <div className={styles.filters} aria-label="Refine the vault">
          <ChipRow
            label="Sport"
            value={filters.sport}
            options={sports}
            onChange={(value) =>
              setFilters((current) => ({ ...current, sport: value }))
            }
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          <ChipRow
            label="Year"
            value={filters.year}
            options={years}
            onChange={(value) =>
              setFilters((current) => ({ ...current, year: value }))
            }
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          <ChipRow
            label="Set"
            value={filters.set}
            options={sets}
            onChange={(value) =>
              setFilters((current) => ({ ...current, set: value }))
            }
            chipClassName={styles.chip}
            chipOnClassName={`${styles.chip} ${styles.chipOn}`}
            labelClassName={styles.chipLabel}
            rowClassName={styles.chipRow}
          />
          {hasActive ? (
            <button
              type="button"
              className={styles.reset}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear
            </button>
          ) : null}
        </div>

        {filtered.length > 0 ? (
          <ol className={styles.list}>
            {filtered.map((row, order) => {
              const title = slabTitle(row.slab) || "Slab";
              const grade = slabGradeLabel(row.slab);
              const indexLabel = String(order + 1).padStart(2, "0");
              return (
                <li key={row.slab.id || `${instanceId}-${row.index}`}>
                  <Link
                    href={slabHref(row.slab)}
                    className={styles.plate}
                    aria-label={title}
                  >
                    <p className={styles.index} aria-hidden>
                      {indexLabel}
                    </p>
                    <figure className={styles.frame}>
                      <MediaSlot
                        url={row.slab.imageUrl}
                        slotId={`${instanceId}_${row.index + 1}`}
                        jsonPath={slabImagePath(instanceId, row)}
                        alt={row.slab.imageAlt.trim() || title}
                        className={styles.image}
                      />
                    </figure>
                    <div className={styles.copy}>
                      <p className={styles.year}>{slabYearLabel(row.slab)}</p>
                      <h3 className={styles.player}>{row.slab.player}</h3>
                      <p className={styles.line}>
                        {[row.slab.set, row.slab.parallel]
                          .filter((part) => part.trim())
                          .join("  ·  ")}
                      </p>
                      <dl className={styles.facts}>
                        {row.slab.sport.trim() ? (
                          <div>
                            <dt>Sport</dt>
                            <dd>{row.slab.sport}</dd>
                          </div>
                        ) : null}
                        {grade ? (
                          <div>
                            <dt>Grade</dt>
                            <dd>{grade}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {publicItemPrice(row.slab.price, data, row.slab) ? (
                      <p className={styles.price}>
                        {publicItemPrice(row.slab.price, data, row.slab)}
                      </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className={styles.empty} role="status">
            Nothing in the vault matches that search.
          </p>
        )}
      </div>
    </section>
  );
}
