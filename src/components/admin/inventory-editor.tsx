"use client";

import { useMemo, useState } from "react";
import {
  emptyFromSchema,
  fieldsForSchema,
} from "@/lib/admin/schema-fields";
import {
  SLAB_STATUS_LABELS,
  VEHICLE_STATUS_LABELS,
  slugifyVehicleId,
  vehicleToSlab,
} from "@/components/inventory/data";
import {
  inventoryBlueprintSchema,
  slabSchema,
  vehicleSchema,
} from "@/components/inventory/blueprint";
import type {
  BrochureInventoryContent,
  BrochureSlab,
  BrochureVehicle,
} from "@/types/brochure";
import { FieldList } from "./field-editor";
import admin from "./admin.module.scss";
import styles from "./inventory-editor.module.scss";

const PAGE_SIZE = 12;

const VEHICLE_LABELS: Record<string, string> = {
  make: "Brand",
  model: "Name",
  transmission: "Sport",
  chassis: "Cert",
  metricLabel: "Grade label",
  metricValue: "Grade",
  placedNote: "Band",
  imageUrl: "Photo",
  imageAlt: "Photo alt",
  galleryImageUrls: "More photos",
};

const SLAB_LABELS: Record<string, string> = {
  player: "Player",
  set: "Set",
  sport: "Sport",
  band: "Band",
  imageUrl: "Photo",
  imageAlt: "Photo alt",
  galleryImageUrls: "More photos",
};

type CatalogSource = "vehicles" | "items";
type View =
  | { pane: "list" }
  | { pane: "settings" }
  | { pane: "item"; index: number };

function asInventory(value: unknown): BrochureInventoryContent {
  const parsed = inventoryBlueprintSchema.safeParse(value);
  return parsed.success ? parsed.data : inventoryBlueprintSchema.parse({});
}

function catalogSource(data: BrochureInventoryContent): CatalogSource {
  const variant = String(data.variant);
  if (variant === "case" || variant === "binder" || variant === "vault") {
    return "items";
  }
  const items = data.items ?? [];
  const authored = items.some(
    (item) => item.id.trim() || item.imageUrl.trim() || item.player.trim(),
  );
  return authored ? "items" : "vehicles";
}

function uniqueTags(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

function matchesQuery(haystack: string[], query: string): boolean {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  return haystack.some((part) => part.toLowerCase().includes(needle));
}

export function InventoryEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const data = asInventory(value);
  const source = catalogSource(data);
  const records = source === "items" ? (data.items ?? []) : data.vehicles;
  const [view, setView] = useState<View>({ pane: "list" });
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");
  const [band, setBand] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    return records.map((record, index) => {
      const slab =
        source === "items"
          ? (record as BrochureSlab)
          : vehicleToSlab(record as BrochureVehicle);
      return { index, slab, record };
    });
  }, [records, source]);

  const sports = useMemo(
    () => uniqueTags(rows.map((row) => row.slab.sport)),
    [rows],
  );
  const bands = useMemo(
    () => uniqueTags(rows.map((row) => row.slab.band)),
    [rows],
  );
  const statuses =
    source === "items"
      ? (Object.keys(SLAB_STATUS_LABELS) as Array<keyof typeof SLAB_STATUS_LABELS>)
      : (Object.keys(VEHICLE_STATUS_LABELS) as Array<
          keyof typeof VEHICLE_STATUS_LABELS
        >);

  const filtered = useMemo(() => {
    return rows.filter(({ slab }) => {
      if (sport && slab.sport.trim().toLowerCase() !== sport.toLowerCase()) {
        return false;
      }
      if (status && slab.status !== status) {
        return false;
      }
      if (band && slab.band.trim().toLowerCase() !== band.toLowerCase()) {
        return false;
      }
      return matchesQuery(
        [
          slab.year,
          slab.player,
          slab.set,
          slab.parallel,
          slab.sport,
          slab.band,
          slab.price,
          slab.grader,
          slab.grade,
          slab.id,
        ],
        query,
      );
    });
  }, [band, query, rows, sport, status]);

  const visible = filtered.slice(0, shown);
  const statusLabel =
    source === "items"
      ? (key: string) =>
          SLAB_STATUS_LABELS[key as keyof typeof SLAB_STATUS_LABELS] ?? key
      : (key: string) =>
          VEHICLE_STATUS_LABELS[key as keyof typeof VEHICLE_STATUS_LABELS] ??
          key;

  function patchCatalog(next: unknown[]) {
    onChange({
      ...(typeof value === "object" && value ? value : {}),
      [source]: next,
    });
  }

  function addRecord() {
    const id = `slab-${Date.now().toString(36)}`;
    const fresh =
      source === "items"
        ? ({
            ...(emptyFromSchema(slabSchema) as BrochureSlab),
            id,
            slug: slugifyVehicleId(id),
          } as BrochureSlab)
        : ({
            ...(emptyFromSchema(vehicleSchema) as BrochureVehicle),
            id,
            slug: slugifyVehicleId(id),
          } as BrochureVehicle);
    patchCatalog([fresh, ...records]);
    setQuery("");
    setSport("");
    setStatus("");
    setBand("");
    setShown(PAGE_SIZE);
    setView({ pane: "item", index: 0 });
  }

  if (view.pane === "item") {
    const current = records[view.index];
    if (!current) {
      return null;
    }
    const slab =
      source === "items"
        ? (current as BrochureSlab)
        : vehicleToSlab(current as BrochureVehicle);
    const title =
      [slab.year, slab.player].filter((part) => part.trim()).join(" ") ||
      "New slab";
    return (
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={admin.ghost}
            onClick={() => setView({ pane: "list" })}
          >
            Back to list
          </button>
          <p className={styles.itemTitle}>{title}</p>
        </div>
        <div className={styles.scroll}>
          <FieldList
            fields={fieldsForSchema(
              source === "items" ? slabSchema : vehicleSchema,
              current,
              { locked: [], prefix: "" },
            ).filter((field) => field.key !== "provenance")}
            value={current}
            labels={source === "items" ? SLAB_LABELS : VEHICLE_LABELS}
            onChange={(nextItem) => {
              const next = [...records];
              next[view.index] = nextItem as typeof current;
              patchCatalog(next);
            }}
          />
          <div className={styles.itemActions}>
            <button
              type="button"
              className={admin.itemButton}
              disabled={view.index === 0}
              onClick={() => {
                if (view.index === 0) return;
                const next = [...records];
                const [item] = next.splice(view.index, 1);
                next.splice(view.index - 1, 0, item);
                patchCatalog(next);
                setView({ pane: "item", index: view.index - 1 });
              }}
            >
              Move up
            </button>
            <button
              type="button"
              className={admin.itemButton}
              disabled={view.index >= records.length - 1}
              onClick={() => {
                if (view.index >= records.length - 1) return;
                const next = [...records];
                const [item] = next.splice(view.index, 1);
                next.splice(view.index + 1, 0, item);
                patchCatalog(next);
                setView({ pane: "item", index: view.index + 1 });
              }}
            >
              Move down
            </button>
            <button
              type="button"
              className={admin.ghost}
              onClick={() => {
                if (!window.confirm("Remove this slab from inventory?")) {
                  return;
                }
                patchCatalog(records.filter((_, i) => i !== view.index));
                setView({ pane: "list" });
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view.pane === "settings") {
    const settingsFields = fieldsForSchema(inventoryBlueprintSchema, data, {
      locked: ["variant"],
    }).filter((field) => field.key !== "vehicles" && field.key !== "items");
    return (
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Inventory editor">
            <button
              type="button"
              className={styles.tab}
              onClick={() => setView({ pane: "list" })}
            >
              Slabs
            </button>
            <button type="button" className={styles.tab} data-active="true">
              Page
            </button>
          </div>
        </div>
        <div className={styles.scroll}>
          <FieldList
            fields={settingsFields}
            value={data}
            onChange={(next) => {
              const record =
                next && typeof next === "object" ? (next as Record<string, unknown>) : {};
              onChange({
                ...record,
                vehicles: data.vehicles,
                items: data.items,
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Inventory editor">
          <button type="button" className={styles.tab} data-active="true">
            Slabs
          </button>
          <button
            type="button"
            className={styles.tab}
            onClick={() => setView({ pane: "settings" })}
          >
            Page
          </button>
        </div>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search inventory</span>
          <input
            type="search"
            value={query}
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search player, year, set…"
            onChange={(event) => {
              setQuery(event.target.value);
              setShown(PAGE_SIZE);
            }}
          />
        </label>
        {sports.length > 0 ? (
          <div className={styles.chips} role="group" aria-label="Sport">
            <FilterChip
              label="All sports"
              active={!sport}
              onClick={() => {
                setSport("");
                setShown(PAGE_SIZE);
              }}
            />
            {sports.map((tag) => (
              <FilterChip
                key={tag}
                label={tag}
                active={sport.toLowerCase() === tag.toLowerCase()}
                onClick={() => {
                  setSport(tag);
                  setShown(PAGE_SIZE);
                }}
              />
            ))}
          </div>
        ) : null}
        <div className={styles.chips} role="group" aria-label="Status">
          <FilterChip
            label="Any status"
            active={!status}
            onClick={() => {
              setStatus("");
              setShown(PAGE_SIZE);
            }}
          />
          {statuses.map((key) => (
            <FilterChip
              key={key}
              label={statusLabel(key)}
              active={status === key}
              onClick={() => {
                setStatus(key);
                setShown(PAGE_SIZE);
              }}
            />
          ))}
        </div>
        {bands.length > 0 ? (
          <div className={styles.chips} role="group" aria-label="Band">
            <FilterChip
              label="All bands"
              active={!band}
              onClick={() => {
                setBand("");
                setShown(PAGE_SIZE);
              }}
            />
            {bands.map((tag) => (
              <FilterChip
                key={tag}
                label={tag}
                active={band.toLowerCase() === tag.toLowerCase()}
                onClick={() => {
                  setBand(tag);
                  setShown(PAGE_SIZE);
                }}
              />
            ))}
          </div>
        ) : null}
        <div className={styles.addRow}>
          <p className={styles.count}>
            {filtered.length === rows.length
              ? `${rows.length} slabs`
              : `${filtered.length} of ${rows.length}`}
          </p>
          <button type="button" className={admin.primary} onClick={addRecord}>
            Add slab
          </button>
        </div>
      </div>
      <div className={styles.scroll}>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p>No slabs match those filters.</p>
            <button
              type="button"
              className={admin.ghost}
              onClick={() => {
                setQuery("");
                setSport("");
                setStatus("");
                setBand("");
                setShown(PAGE_SIZE);
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {visible.map(({ index, slab }) => (
              <li key={`${slab.id || "row"}-${index}`}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => setView({ pane: "item", index })}
                >
                  <Thumb src={slab.imageUrl} alt="" />
                  <span className={styles.meta}>
                    <span className={styles.name}>
                      {[slab.year, slab.player].filter(Boolean).join(" ") ||
                        "Untitled slab"}
                    </span>
                    <span className={styles.sub}>
                      {[
                        slab.sport,
                        [slab.grader, slab.grade].filter(Boolean).join(" "),
                        slab.price,
                      ]
                        .filter((part) => part.trim())
                        .join(" · ")}
                    </span>
                    <span className={styles.status}>{statusLabel(slab.status)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {filtered.length > visible.length ? (
          <button
            type="button"
            className={admin.ghost}
            onClick={() => setShown((count) => count + PAGE_SIZE)}
          >
            Show more ({filtered.length - visible.length} left)
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.chip}
      data-active={active ? "true" : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src.trim() || failed) {
    return <span className={styles.thumbFallback} aria-hidden />;
  }
  return (
    // Catalog thumbs can be any uploaded host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={styles.thumb}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
