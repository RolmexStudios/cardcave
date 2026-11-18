"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import admin from "./admin.module.scss";
import styles from "./sheet-select.module.scss";

const MOBILE_QUERY = "(max-width: 767px)";

export type SheetOption = {
  value: string;
  label: string;
};

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

export function SheetSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  hideLabel = false,
}: {
  label: string;
  value: string;
  options: SheetOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  const mobile = useMobileSheet();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((option) => option.value === value);
  const shown = selected?.label ?? placeholder ?? label;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const node = listRef.current?.querySelector("[data-selected]");
    node?.scrollIntoView({ block: "nearest" });
    const previous = document.body.style.overflow;
    if (mobile) {
      document.body.style.overflow = "hidden";
    }
    function onPointerDown(event: PointerEvent) {
      if (mobile) return;
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }
    if (!mobile) {
      document.addEventListener("pointerdown", onPointerDown);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobile, open]);

  const list = (
    <ul ref={listRef} className={mobile ? styles.list : styles.menu} role="listbox">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <li key={option.value || "empty"}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              data-selected={isSelected ? "true" : undefined}
              className={styles.option}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={rootRef} className={`${admin.field} ${styles.root}`}>
      {hideLabel ? null : <span>{label}</span>}
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
      >
        <span data-empty={!selected ? "true" : undefined}>{shown}</span>
      </button>
      {open && !mobile ? list : null}
      {mounted && open && mobile
        ? createPortal(
            <div className={styles.scrim} onClick={() => setOpen(false)}>
              <div
                className={styles.sheet}
                role="dialog"
                aria-label={label}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.handle} aria-hidden />
                <p className={styles.title}>{label}</p>
                {list}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
