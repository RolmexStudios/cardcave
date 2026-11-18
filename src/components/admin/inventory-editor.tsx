"use client";

import { useMemo, useState } from "react";
import {
  emptyFromSchema,
  fieldsForSchema,
} from "@/lib/admin/schema-fields";
import {
  hasSlabPhoto,
  SLAB_STATUS_LABELS,
  slabYearLabel,
  VEHICLE_STATUS_LABELS,
  slugifyVehicleId,
  vehicleToSlab,
} from "@/components/inventory/data";
import {
  collectFilterYears,
  matchesYearFilter,
  parseYearRange,
} from "@/components/shared/year-range";
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
import { rewriteMediaUrl } from "@/lib/admin/media-url";
import { useBrochureStore } from "@/lib/admin/store";
import { FieldList } from "./field-editor";
import { ImageField } from "./image-field";
import { SheetSelect } from "./sheet-select";
import admin from "./admin.module.scss";
import styles from "./inventory-editor.module.scss";

const PAGE_SIZE = 12;
const SLAB_VARIANTS = new Set(["case", "binder", "vault", "cards"]);
const NEW_SPORT = "__new__";

const SETTINGS_LABELS: Record<string, string> = {
  showPrices: "Show prices to visitors",
  showStatusFilter: "Show availability filter",
};

const VEHICLE_LABELS: Record<string, string> = {
  make: "Brand",
  model: "Player name",
  transmission: "Sport",
  chassis: "Cert",
  metricLabel: "Grade label",
  metricValue: "Grade",
  placedNote: "Band",
  imageUrl: "Front picture",
  backImageUrl: "Back picture",
  galleryImageUrls: "More photos",
  backText: "Back text",
  showPrice: "Show price to visitors",
  yearEnd: "End year",
  description: "Notes",
};

const SLAB_LABELS: Record<string, string> = {
  player: "Player name",
  set: "Set",
  sport: "Sport",
  band: "Band",
  imageUrl: "Front picture",
  backImageUrl: "Back picture",
  galleryImageUrls: "More photos",
  backText: "Back text",
  showPrice: "Show price to visitors",
  yearEnd: "End year",
  description: "Notes",
};

const SLAB_HIDDEN = new Set([
  "id",
  "slug",
  "cert",
  "imageAlt",
  "backImageAlt",
  "galleryImageUrls",
  "provenance",
  "year",
  "yearEnd",
  "sport",
  "imageUrl",
  "backImageUrl",
  "player",
  "set",
  "band",
  "backText",
  "description",
]);

const VEHICLE_SLAB_HIDDEN = new Set([
  "id",
  "slug",
  "chassis",
  "imageAlt",
  "backImageAlt",
  "galleryImageUrls",
  "provenance",
  "year",
  "yearEnd",
  "transmission",
  "imageUrl",
  "backImageUrl",
  "model",
  "make",
  "metricLabel",
  "placedNote",
  "backText",
  "description",
]);

const VEHICLE_SLAB_LABELS: Record<string, string> = {
  ...VEHICLE_LABELS,
  make: "Set",
  model: "Player name",
};

const CAR_GEARBOX = /^(manual|automatic|pdk|dct|cvt|semi-automatic|sequential)/i;

const VEHICLE_HIDDEN = new Set(["provenance", "yearEnd", "imageAlt", "backImageAlt"]);

type CatalogSource = "vehicles" | "items";
type View =
  | { pane: "list" }
  | { pane: "settings" }
  | { pane: "item"; index: number }
  | { pane: "draft" };

function asInventory(value: unknown): BrochureInventoryContent {
  const parsed = inventoryBlueprintSchema.safeParse(value);
  return parsed.success ? parsed.data : inventoryBlueprintSchema.parse({});
}

function isSlabInventory(data: BrochureInventoryContent): boolean {
  if (SLAB_VARIANTS.has(String(data.variant))) {
    return true;
  }
  const items = data.items ?? [];
  if (items.some((item) => item.player.trim() || item.imageUrl.trim() || item.id.trim())) {
    return true;
  }
  const transmissions = data.vehicles
    .map((vehicle) => vehicle.transmission.trim())
    .filter(Boolean);
  return transmissions.length > 0 && transmissions.every((value) => !CAR_GEARBOX.test(value));
}

function catalogSource(data: BrochureInventoryContent): CatalogSource {
  const variant = String(data.variant);
  const items = data.items ?? [];
  const authoredItems = items.some(
    (item) => item.id.trim() || item.imageUrl.trim() || item.player.trim(),
  );
  const authoredVehicles = data.vehicles.some(
    (vehicle) => vehicle.id.trim() || vehicle.imageUrl.trim() || vehicle.model.trim(),
  );
  if (SLAB_VARIANTS.has(variant)) {
    return authoredItems || !authoredVehicles ? "items" : "vehicles";
  }
  return authoredItems ? "items" : "vehicles";
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

function readString(item: object, key: string): string {
  return String((item as Record<string, unknown>)[key] ?? "");
}

function patchRecord<T extends object>(item: T, patch: Record<string, unknown>): T {
  return { ...item, ...patch } as T;
}

function withCoverPhoto(item: unknown): unknown {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }
  const record = item as {
    imageUrl?: unknown;
    imageAlt?: unknown;
    galleryImageUrls?: unknown;
    backImageUrl?: unknown;
    backImageAlt?: unknown;
    player?: unknown;
    model?: unknown;
    year?: unknown;
    yearEnd?: unknown;
  };
  let imageUrl = String(record.imageUrl ?? "").trim();
  const gallery = Array.isArray(record.galleryImageUrls)
    ? record.galleryImageUrls.map(String)
    : [];
  if (!imageUrl) {
    imageUrl = gallery.find((url) => url.trim())?.trim() ?? "";
  }
  const player =
    String(record.player ?? "").trim() || String(record.model ?? "").trim();
  const year = slabYearLabel({
    year: String(record.year ?? ""),
    yearEnd: String(record.yearEnd ?? ""),
  });
  const title = [year, player].filter(Boolean).join(" ");
  const imageAlt = String(record.imageAlt ?? "").trim();
  const backImageUrl = String(record.backImageUrl ?? "").trim();
  const backImageAlt = String(record.backImageAlt ?? "").trim();
  return {
    ...record,
    imageUrl: imageUrl || String(record.imageUrl ?? ""),
    imageAlt:
      imageAlt ||
      (imageUrl ? (title ? `Front of ${title}` : "Front of card") : ""),
    backImageAlt:
      backImageAlt ||
      (backImageUrl ? (title ? `Back of ${title}` : "Back of card") : ""),
  };
}

function isDraftDirty(item: object): boolean {
  const keys = [
    "imageUrl",
    "backImageUrl",
    "player",
    "model",
    "year",
    "yearEnd",
    "set",
    "make",
    "sport",
    "transmission",
    "price",
    "description",
  ];
  return keys.some((key) => readString(item, key).trim());
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
  const slabForm = isSlabInventory(data);
  const records = source === "items" ? (data.items ?? []) : data.vehicles;
  const [view, setView] = useState<View>({ pane: "list" });
  const [draft, setDraft] = useState<BrochureSlab | BrochureVehicle | null>(null);
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [photoError, setPhotoError] = useState(false);

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
  const years = useMemo(
    () => collectFilterYears(rows.map((row) => row.slab)),
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
      if (!matchesYearFilter(slab, year, "")) {
        return false;
      }
      if (status && slab.status !== status) {
        return false;
      }
      return matchesQuery(
        [
          slabYearLabel(slab),
          slab.year,
          slab.yearEnd ?? "",
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
  }, [query, rows, sport, status, year]);

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

  function resetFilters() {
    setQuery("");
    setSport("");
    setYear("");
    setStatus("");
    setShown(PAGE_SIZE);
  }

  function addRecord() {
    const id = `slab-${Date.now().toString(36)}`;
    const fresh =
      source === "items"
        ? ({
            ...(emptyFromSchema(slabSchema) as BrochureSlab),
            id,
            slug: slugifyVehicleId(id),
            showPrice: true,
          } as BrochureSlab)
        : ({
            ...(emptyFromSchema(vehicleSchema) as BrochureVehicle),
            id,
            slug: slugifyVehicleId(id),
            showPrice: true,
          } as BrochureVehicle);
    setPhotoError(false);
    setDraft(fresh);
    resetFilters();
    setView({ pane: "draft" });
  }

  function commitDraft(item: BrochureSlab | BrochureVehicle) {
    const prepared = withCoverPhoto(item) as typeof item;
    if (!hasSlabPhoto(prepared)) {
      setPhotoError(true);
      setDraft(prepared);
      return;
    }
    patchCatalog([prepared, ...records]);
    setDraft(null);
    setPhotoError(false);
    setView({ pane: "item", index: 0 });
  }

  function closeItem() {
    if (view.pane === "draft" && draft && isDraftDirty(draft)) {
      if (!window.confirm("Discard this slab? It has no front picture yet, so it was not saved.")) {
        return;
      }
    }
    setDraft(null);
    setPhotoError(false);
    setView({ pane: "list" });
  }

  if (view.pane === "item" || view.pane === "draft") {
    const current =
      view.pane === "draft" ? draft : records[view.index];
    if (!current) {
      return null;
    }
    const slab =
      source === "items"
        ? (current as BrochureSlab)
        : vehicleToSlab(current as BrochureVehicle);
    const title =
      [slabYearLabel(slab), slab.player].filter((part) => part.trim()).join(" ") ||
      "New slab";
    const isDraft = view.pane === "draft";
    const itemIndex = view.pane === "item" ? view.index : -1;
    const missingPhoto = !hasSlabPhoto(current);

    function saveItem(nextItem: unknown) {
      const prepared = withCoverPhoto(nextItem) as BrochureSlab | BrochureVehicle;
      if (isDraft) {
        setDraft(prepared);
        if (hasSlabPhoto(prepared)) {
          commitDraft(prepared);
        }
        return;
      }
      const next = [...records];
      next[itemIndex] = prepared;
      patchCatalog(next);
    }

    return (
      <div className={styles.root}>
        <div className={`${styles.toolbar} ${styles.itemHead}`}>
          <button type="button" className={admin.ghost} onClick={closeItem}>
            Back
          </button>
          <p className={styles.itemTitle}>{title}</p>
        </div>
        <div className={styles.scroll}>
          {missingPhoto && photoError ? (
            <p className={styles.banner} role="status">
              Add a front picture before this slab can be saved.
            </p>
          ) : null}
          {slabForm ? (
            <SlabFields
              current={current}
              source={source}
              sports={sports}
              onChange={saveItem}
            />
          ) : (
            <>
              <YearRangeField
                year={readString(current, "year")}
                yearEnd={readString(current, "yearEnd")}
                onChange={(nextYear, nextEnd) =>
                  saveItem(patchRecord(current, { year: nextYear, yearEnd: nextEnd }))
                }
              />
              <FieldList
                fields={fieldsForSchema(vehicleSchema, current, {
                  locked: [],
                  prefix: "",
                }).filter(
                  (field) =>
                    field.key !== "provenance" &&
                    field.key !== "year" &&
                    !VEHICLE_HIDDEN.has(field.key),
                )}
                value={current}
                labels={VEHICLE_LABELS}
                onChange={saveItem}
              />
            </>
          )}
          {isDraft ? (
            <div className={styles.itemActions}>
              <button
                type="button"
                className={admin.primary}
                onClick={() => commitDraft(current)}
              >
                Add slab
              </button>
            </div>
          ) : (
            <div className={styles.itemActions}>
              <button
                type="button"
                className={admin.itemButton}
                disabled={itemIndex <= 0}
                onClick={() => {
                  if (itemIndex <= 0) return;
                  const next = [...records];
                  const [item] = next.splice(itemIndex, 1);
                  next.splice(itemIndex - 1, 0, item);
                  patchCatalog(next);
                  setView({ pane: "item", index: itemIndex - 1 });
                }}
              >
                Move up
              </button>
              <button
                type="button"
                className={admin.itemButton}
                disabled={itemIndex < 0 || itemIndex >= records.length - 1}
                onClick={() => {
                  if (itemIndex < 0 || itemIndex >= records.length - 1) {
                    return;
                  }
                  const next = [...records];
                  const [item] = next.splice(itemIndex, 1);
                  next.splice(itemIndex + 1, 0, item);
                  patchCatalog(next);
                  setView({ pane: "item", index: itemIndex + 1 });
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
                  patchCatalog(records.filter((_, i) => i !== itemIndex));
                  setView({ pane: "list" });
                }}
              >
                Remove
              </button>
            </div>
          )}
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
            labels={SETTINGS_LABELS}
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
            placeholder="Search player, year…"
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
        {years.length > 0 ? (
          <SheetSelect
            label="Year"
            hideLabel
            value={year}
            placeholder="All years"
            options={[
              { value: "", label: "All years" },
              ...years.map((tag) => ({ value: tag, label: tag })),
            ]}
            onChange={(next) => {
              setYear(next);
              setShown(PAGE_SIZE);
            }}
          />
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
              onClick={resetFilters}
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
                      {[slabYearLabel(slab), slab.player]
                        .filter(Boolean)
                        .join(" ") || "Untitled slab"}
                    </span>
                    <span className={styles.sub}>
                      {[
                        slab.sport,
                        [slab.grader, slab.grade].filter(Boolean).join(" "),
                        slab.showPrice === false ? "" : slab.price,
                      ]
                        .filter((part) => part.trim())
                        .join(" · ")}
                    </span>
                    <span className={styles.status}>
                      {statusLabel(slab.status)}
                      {hasSlabPhoto(slab) ? "" : " · Needs photo"}
                    </span>
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

function SlabFields({
  current,
  source,
  sports,
  onChange,
}: {
  current: BrochureSlab | BrochureVehicle;
  source: CatalogSource;
  sports: string[];
  onChange: (next: BrochureSlab | BrochureVehicle) => void;
}) {
  const playerKey = source === "items" ? "player" : "model";
  const sportKey = source === "items" ? "sport" : "transmission";
  const hidden = source === "items" ? SLAB_HIDDEN : VEHICLE_SLAB_HIDDEN;
  const schema = source === "items" ? slabSchema : vehicleSchema;
  const labels = source === "items" ? SLAB_LABELS : VEHICLE_SLAB_LABELS;

  return (
    <>
      <div className={styles.photos}>
        <ImageField
          label="Front"
          emptyLabel="Front"
          shape="card"
          required
          value={readString(current, "imageUrl")}
          onChange={(url) => onChange(patchRecord(current, { imageUrl: url }))}
        />
        <ImageField
          label="Back"
          emptyLabel="Back"
          shape="card"
          value={readString(current, "backImageUrl")}
          onChange={(url) => onChange(patchRecord(current, { backImageUrl: url }))}
        />
      </div>
      <label className={admin.field}>
        <span>Player name</span>
        <input
          value={readString(current, playerKey)}
          autoComplete="off"
          onChange={(event) =>
            onChange(patchRecord(current, { [playerKey]: event.target.value }))
          }
        />
      </label>
      <YearRangeField
        year={readString(current, "year")}
        yearEnd={readString(current, "yearEnd")}
        onChange={(nextYear, nextEnd) =>
          onChange(patchRecord(current, { year: nextYear, yearEnd: nextEnd }))
        }
      />
      <SuggestField
        key={`${readString(current, "id")}-${sportKey}`}
        label="Sport"
        value={readString(current, sportKey)}
        options={sports}
        onChange={(nextSport) =>
          onChange(patchRecord(current, { [sportKey]: nextSport }))
        }
      />
      <FieldList
        fields={fieldsForSchema(schema, current, { locked: [], prefix: "" }).filter(
          (field) => !hidden.has(field.key),
        )}
        value={current}
        labels={labels}
        onChange={(next) => onChange(next as BrochureSlab | BrochureVehicle)}
      />
      <label className={admin.field}>
        <span>Notes</span>
        <textarea
          value={readString(current, "description")}
          onChange={(event) =>
            onChange(patchRecord(current, { description: event.target.value }))
          }
        />
      </label>
    </>
  );
}

const YEAR_MAX = new Date().getFullYear() + 1;
const YEAR_MIN = 1948;

function yearChoices(...extras: string[]): string[] {
  const years = new Set<string>();
  for (let year = YEAR_MAX; year >= YEAR_MIN; year -= 1) {
    years.add(String(year));
  }
  for (const extra of extras) {
    if (/^\d{4}$/.test(extra.trim())) {
      years.add(extra.trim());
    }
  }
  return [...years].sort((a, b) => Number(b) - Number(a));
}

function YearRangeField({
  year,
  yearEnd,
  onChange,
}: {
  year: string;
  yearEnd: string;
  onChange: (year: string, yearEnd: string) => void;
}) {
  const parsed = parseYearRange(year, yearEnd);
  const startValue =
    yearEnd.trim() || /^\d{4}$/.test(year.trim())
      ? year.trim()
      : parsed
        ? String(parsed.start)
        : "";
  const endValue = yearEnd.trim()
    ? yearEnd.trim()
    : parsed && parsed.end !== parsed.start && !/^\d{4}$/.test(year.trim())
      ? String(parsed.end)
      : "";
  const start = /^\d{4}$/.test(startValue) ? startValue : "";
  const end = /^\d{4}$/.test(endValue) ? endValue : "";
  const startNum = start ? Number(start) : 0;
  const toYears = yearChoices(end).filter((option) => Number(option) > startNum);

  return (
    <div className={styles.yearRow}>
      <SheetSelect
        label="Year"
        value={start}
        placeholder="Year"
        options={yearChoices(start).map((option) => ({
          value: option,
          label: option,
        }))}
        onChange={(nextStart) => {
          const nextEnd =
            end && nextStart && Number(end) <= Number(nextStart) ? "" : end;
          onChange(nextStart, nextEnd);
        }}
      />
      <SheetSelect
        label="To"
        value={end}
        placeholder="None"
        disabled={!start}
        options={[
          { value: "", label: "None" },
          ...toYears.map((option) => ({
            value: option,
            label: option,
          })),
        ]}
        onChange={(nextEnd) => onChange(start, nextEnd)}
      />
    </div>
  );
}

function SuggestField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const known = options.some(
    (option) => option.toLowerCase() === value.trim().toLowerCase(),
  );
  const [adding, setAdding] = useState(!known && value.trim() !== "");
  const selectValue = adding ? NEW_SPORT : value;

  if (options.length === 0) {
    return (
      <label className={admin.field}>
        <span>{label}</span>
        <input
          value={value}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  return (
    <>
      <SheetSelect
        label={label}
        value={selectValue}
        placeholder={label}
        options={[
          { value: "", label },
          ...options.map((option) => ({ value: option, label: option })),
          { value: NEW_SPORT, label: "Add another…" },
        ]}
        onChange={(next) => {
          if (next === NEW_SPORT) {
            setAdding(true);
            if (known) onChange("");
            return;
          }
          setAdding(false);
          onChange(next);
        }}
      />
      {adding ? (
        <label className={admin.field}>
          <span className={admin.srOnly}>New sport</span>
          <input
            value={known ? "" : value}
            autoComplete="off"
            autoFocus
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      ) : null}
    </>
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
  const store = useBrochureStore();
  const resolved = store?.site ? rewriteMediaUrl(src, store.site.adminApi) : src;
  const [failed, setFailed] = useState(false);
  if (!resolved.trim() || failed) {
    return <span className={styles.thumbFallback} aria-hidden />;
  }
  return (
    // Catalog thumbs can be any uploaded host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={styles.thumb}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
