"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./filter-select.module.scss";

const OPEN_EVENT = "brochure:filter-select-open";
const ALL_VALUE = "all";
const MOBILE_QUERY = "(max-width: 767px)";

export type FilterSelectProps = {
  id?: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allValue?: string;
  allLabel?: string;
  labelFor?: (value: string) => string;
  /** Overlay menu on desktop; bottom sheet on small screens. */
  variant?: "inline" | "dropdown";
};

type Item = {
  value: string;
  label: string;
};

function optionDomId(rootId: string, value: string) {
  return `${rootId}-opt-${value.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

function useMobileSheet() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return mobile;
}

export function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  allValue = ALL_VALUE,
  allLabel = "All",
  labelFor,
  variant = "inline",
}: FilterSelectProps) {
  const isDropdown = variant === "dropdown";
  const mobile = useMobileSheet();
  const sheet = isDropdown && mobile;
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const listId = `${rootId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo<Item[]>(() => {
    const seen = new Set<string>();
    const next: Item[] = [{ value: allValue, label: allLabel }];
    seen.add(allValue);
    for (const option of options) {
      if (!option || seen.has(option)) continue;
      seen.add(option);
      next.push({
        value: option,
        label: labelFor ? labelFor(option) : option,
      });
    }
    return next;
  }, [allLabel, allValue, labelFor, options]);

  const selected =
    items.find((item) => item.value === value) ?? items[0] ?? {
      value: allValue,
      label: allLabel,
    };
  const active = items[activeIndex] ?? selected;
  const activeId = optionDomId(rootId, active.value);
  const isFiltered = selected.value !== allValue;

  function close() {
    setOpen(false);
  }

  function openMenu(index = items.findIndex((item) => item.value === selected.value)) {
    setActiveIndex(index < 0 ? 0 : index);
    setOpen(true);
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: rootId }));
  }

  function choose(next: Item) {
    onChange(next.value);
    close();
  }

  function move(delta: number) {
    if (!open) {
      openMenu();
      return;
    }
    setActiveIndex((current) => {
      const last = items.length - 1;
      if (last < 0) return 0;
      return (current + delta + items.length) % items.length;
    });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (sheet) return;
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    function onForeignOpen(event: Event) {
      if ((event as CustomEvent<string>).detail !== rootId) {
        close();
      }
    }

    if (!sheet) {
      document.addEventListener("pointerdown", onPointerDown);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener(OPEN_EVENT, onForeignOpen);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener(OPEN_EVENT, onForeignOpen);
    };
  }, [open, rootId, sheet]);

  useEffect(() => {
    if (!open || !sheet) return;
    const node =
      listRef.current?.querySelector("[data-active]") ??
      listRef.current?.querySelector("[data-selected]");
    node?.scrollIntoView({ block: "center" });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeIndex, open, sheet]);

  const list = (
    <ul
      ref={listRef}
      id={listId}
      className={sheet ? styles.sheetList : styles.menu}
      role="listbox"
      aria-labelledby={`${rootId}-label`}
    >
      {items.map((item, index) => {
        const selectedItem = item.value === selected.value;
        const activeItem = item.value === active.value;
        if (sheet) {
          return (
            <li key={item.value}>
              <button
                type="button"
                id={optionDomId(rootId, item.value)}
                role="option"
                aria-selected={selectedItem}
                className={styles.sheetOption}
                data-active={activeItem || undefined}
                data-selected={selectedItem || undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
              >
                {item.label}
              </button>
            </li>
          );
        }
        return (
          <li
            key={item.value}
            id={optionDomId(rootId, item.value)}
            role="option"
            aria-selected={selectedItem}
            className={styles.option}
            data-active={activeItem || undefined}
            data-selected={selectedItem || undefined}
            onMouseEnter={() => setActiveIndex(index)}
            onPointerDown={(event) => {
              event.preventDefault();
              choose(item);
            }}
          >
            {isDropdown ? null : (
              <span className={styles.index} aria-hidden="true">
                {index === 0 ? "—" : String(index).padStart(2, "0")}
              </span>
            )}
            <span className={styles.optionLabel}>{item.label}</span>
            {isDropdown ? (
              <span className={styles.check} aria-hidden="true">
                {selectedItem ? "✓" : ""}
              </span>
            ) : (
              <span className={styles.pip} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-variant={variant}
      data-open={open || undefined}
      data-active={isFiltered || undefined}
    >
      <span id={`${rootId}-label`} className={styles.label}>
        {label}
      </span>
      <button
        type="button"
        id={rootId}
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${rootId}-label ${rootId}`}
        aria-activedescendant={open ? activeId : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            move(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            move(-1);
          } else if (event.key === "Home") {
            event.preventDefault();
            if (open) setActiveIndex(0);
            else openMenu(0);
          } else if (event.key === "End") {
            event.preventDefault();
            const last = Math.max(items.length - 1, 0);
            if (open) setActiveIndex(last);
            else openMenu(last);
          } else if (event.key === "Enter" || event.key === " ") {
            if (open) {
              event.preventDefault();
              choose(active);
            }
          }
        }}
      >
        <span className={styles.value}>{selected.label}</span>
        <span
          className={isDropdown ? styles.chevron : styles.mark}
          aria-hidden="true"
        />
      </button>
      {open && !sheet ? list : null}
      {mounted && open && sheet
        ? createPortal(
            <div className={styles.scrim} onClick={close}>
              <div
                className={styles.sheet}
                role="dialog"
                aria-label={label}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.handle} aria-hidden />
                <p className={styles.sheetTitle}>{label}</p>
                {list}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
