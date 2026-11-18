"use client";

import { useMemo, useState } from "react";
import { FilterSelect } from "@/components/shared/filter-select";
import { TextSlot } from "@/components/shared/text-slot";
import { SectionHeading } from "@/components/shared/section-heading";
import { FlipCard } from "@/components/shared/flip-card";
import { StaggerList } from "@/components/shared/stagger-list";
import { fieldPath } from "@/components/shared/field-path";
import { emptyInventoryBlueprint } from "@/components/inventory/blueprint";
import {
  indexedInventorySlabs,
  slabHref,
  slabImagePath,
  slabTitle,
  SLAB_STATUS_LABELS,
  uniqueSorted,
  vehicleHref,
} from "@/components/inventory/data";
import type {
  BrochureBlockProps,
  BrochureInventoryContent,
} from "@/types/brochure";
import styles from "./cards.module.scss";

const ALL = "all";

type FilterState = {
  sport: string;
  grader: string;
  grade: string;
  status: string;
};

const EMPTY_FILTERS: FilterState = {
  sport: ALL,
  grader: ALL,
  grade: ALL,
  status: ALL,
};

export function CardsInventory({
  instanceId = "BrochureInventory_1",
  data = emptyInventoryBlueprint(),
}: BrochureBlockProps<BrochureInventoryContent>) {
  const indexed = useMemo(() => indexedInventorySlabs(data), [data]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const sports = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slab.sport)),
    [indexed],
  );
  const graders = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slab.grader)),
    [indexed],
  );
  const grades = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slab.grade)),
    [indexed],
  );
  const statuses = useMemo(
    () => uniqueSorted(indexed.map(({ slab }) => slab.status)),
    [indexed],
  );

  const filtered = useMemo(
    () =>
      indexed.filter(({ slab }) => {
        if (filters.sport !== ALL && slab.sport.trim() !== filters.sport) {
          return false;
        }
        if (filters.grader !== ALL && slab.grader.trim() !== filters.grader) {
          return false;
        }
        if (filters.grade !== ALL && slab.grade.trim() !== filters.grade) {
          return false;
        }
        if (filters.status !== ALL && slab.status !== filters.status) {
          return false;
        }
        return true;
      }),
    [indexed, filters],
  );

  const hasActive =
    filters.sport !== ALL ||
    filters.grader !== ALL ||
    filters.grade !== ALL ||
    filters.status !== ALL;
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const countLabel =
    filtered.length === indexed.length
      ? `${indexed.length} cards`
      : `${filtered.length} of ${indexed.length}`;

  return (
    <section id={instanceId} className={styles.section} aria-label="Cards">
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

        <div className={styles.filters} aria-label="Filter the cards">
          <FilterSelect
            id={`${instanceId}-sport`}
            variant="dropdown"
            label="Sport"
            value={filters.sport}
            options={sports}
            onChange={(value) =>
              setFilters((current) => ({ ...current, sport: value }))
            }
          />
          <FilterSelect
            id={`${instanceId}-grader`}
            variant="dropdown"
            label="Grading company"
            value={filters.grader}
            options={graders}
            onChange={(value) =>
              setFilters((current) => ({ ...current, grader: value }))
            }
          />
          <FilterSelect
            id={`${instanceId}-grade`}
            variant="dropdown"
            label="Grade"
            value={filters.grade}
            options={grades}
            onChange={(value) =>
              setFilters((current) => ({ ...current, grade: value }))
            }
          />
          <FilterSelect
            id={`${instanceId}-status`}
            variant="dropdown"
            label="Availability"
            value={filters.status}
            options={statuses}
            labelFor={(value) =>
              SLAB_STATUS_LABELS[value as keyof typeof SLAB_STATUS_LABELS] ?? value
            }
            onChange={(value) =>
              setFilters((current) => ({ ...current, status: value }))
            }
          />
          <button
            type="button"
            className={styles.reset}
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={!hasActive}
          >
            Reset filters
          </button>
        </div>

        {filtered.length > 0 ? (
          <StaggerList
            key={`${filters.sport}|${filters.grader}|${filters.grade}|${filters.status}|${filtered.length}`}
            className={styles.grid}
            playKey={`${filters.sport}|${filters.grader}|${filters.grade}|${filters.status}|${filtered.length}`}
          >
            {filtered.map((row) => {
              const title = slabTitle(row.slab) || "Card";
              const key = row.slab.id || `${instanceId}-${row.index}`;
              const href =
                row.source === "vehicles"
                  ? vehicleHref(data.vehicles[row.index])
                  : slabHref(row.slab);
              const cover = row.slab.imageUrl.trim();
              const backUrl =
                row.slab.backImageUrl.trim() ||
                row.slab.galleryImageUrls.find((url) => {
                  const trimmed = url.trim();
                  return trimmed && trimmed !== cover;
                })?.trim() ||
                "";
              return (
                <li key={key}>
                  <FlipCard
                    className={styles.card}
                    flipped={flippedId === key}
                    onToggle={() =>
                      setFlippedId((current) => (current === key ? null : key))
                    }
                    title={title}
                    frontUrl={row.slab.imageUrl}
                    frontAlt={row.slab.imageAlt.trim() || title}
                    frontSlotId={`${instanceId}_${row.index + 1}`}
                    frontJsonPath={slabImagePath(instanceId, row)}
                    backUrl={backUrl}
                    backAlt={row.slab.backImageAlt}
                    backSlotId={`${instanceId}_${row.index + 1}-back`}
                    backJsonPath={`${instanceId}.${row.source}[${row.index}].backImageUrl`}
                    backText={row.slab.backText.trim() || row.slab.description}
                    kicker={[row.slab.year, row.slab.set, row.slab.sport]
                      .filter((part) => part.trim())
                      .join(" · ")}
                    price={row.slab.price}
                    href={href}
                    hrefLabel="View"
                  />
                </li>
              );
            })}
          </StaggerList>
        ) : (
          <div className={styles.empty} role="status">
            <p>Nothing matches that search.</p>
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
