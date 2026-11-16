"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { MediaSlot, initials } from "@/components/shared/media";
import { TextSlot } from "@/components/shared/text-slot";
import { NavSurfaceHeader } from "@/components/shared/nav-surface";
import { fieldPath } from "@/components/shared/field-path";
import { emptyNavBlueprint } from "@/components/navs/blueprint";
import {
  BROCHURE_QUOTE_CTA,
  brochureContactHref,
} from "@/components/navs/links";
import type {
  BrochureBlockProps,
  BrochureNavContent,
  BrochureNavLink,
} from "@/types/brochure";
import styles from "./capsule.module.scss";

function isHomeHref(href: string) {
  return href === "/" || href === "#top" || href === "/#top";
}

function capsuleLinks(data: BrochureNavContent): BrochureNavLink[] {
  const seen = new Set<string>();
  const items: BrochureNavLink[] = [];

  for (const item of [...data.links, ...data.routeLinks]) {
    const href = item.href.trim();
    const label = item.label.trim();
    if (!href || !label || isHomeHref(href)) {
      continue;
    }
    const key = label.toLowerCase();
    if (seen.has(key) || seen.has(href)) {
      continue;
    }
    seen.add(key);
    seen.add(href);
    items.push({ href, label });
  }

  return items;
}

function CapsuleMark({
  instanceId,
  data,
}: {
  instanceId: string;
  data: BrochureNavContent;
}) {
  const wide =
    data.logoLayout === "horizontal" && data.logoImageUrl.trim().length > 0;
  const markClass = wide ? styles.markWide : styles.mark;

  if (data.logoImageUrl.trim()) {
    return (
      <MediaSlot
        url={data.logoImageUrl}
        slotId={instanceId}
        jsonPath={fieldPath(instanceId, "logoImageUrl")}
        alt=""
        className={markClass}
      />
    );
  }

  const mark = data.logoMark.trim();
  if (mark) {
    return (
      <span className={styles.markFallback} title={mark}>
        {mark}
      </span>
    );
  }

  const fallback = initials(data.businessName);
  if (fallback !== "•") {
    return <span className={styles.markFallback}>{fallback}</span>;
  }

  return (
    <span className={`${styles.markFallback} ${styles.markEmpty}`}>
      {fieldPath(instanceId, "logoMark")}
    </span>
  );
}

export function CapsuleNav({
  instanceId = "BrochureSiteNav_1",
  data = emptyNavBlueprint(),
}: BrochureBlockProps<BrochureNavContent>) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const contactHref = brochureContactHref(data.links);
  const navLinks = capsuleLinks(data).filter(
    (item) =>
      item.href !== contactHref && !item.href.includes("BrochureContact"),
  );
  const showBrandName = data.brandDisplay === "logo-and-name";
  const brandClassName = showBrandName
    ? styles.brand
    : `${styles.brand} ${styles.brandLogoOnly}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onViewportChange() {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open]);

  return (
    <NavSurfaceHeader
      className={styles.header}
      data-logo-reveal={data.logoReveal}
    >
      <div
        ref={rootRef}
        className={styles.shell}
        data-open={open ? "true" : "false"}
      >
        <div className={styles.row}>
          <a
            href="#top"
            className={brandClassName}
            aria-label={data.businessName || "Home"}
          >
            <span data-nav-logo="" className={styles.navLogo}>
              <CapsuleMark instanceId={instanceId} data={data} />
            </span>
            {showBrandName ? (
              <TextSlot
                value={data.businessName}
                jsonPath={fieldPath(instanceId, "businessName")}
                as="span"
                className={styles.brandName}
              />
            ) : null}
          </a>

          <nav className={styles.links} aria-label="Primary">
            {navLinks.map((item) => (
              <a key={`${item.href}-${item.label}`} href={item.href} className={styles.link}>
                {item.label}
              </a>
            ))}
          </nav>

          <a href={contactHref} className={styles.cta}>
            {BROCHURE_QUOTE_CTA.label}
          </a>

          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? (
              <X aria-hidden className={styles.menuIcon} />
            ) : (
              <Menu aria-hidden className={styles.menuIcon} />
            )}
          </button>
        </div>

        <nav
          id={menuId}
          className={styles.drawer}
          aria-label="Primary"
          hidden={!open}
        >
          {navLinks.map((item) => (
            <a
              key={`drawer-${item.href}-${item.label}`}
              href={item.href}
              className={styles.drawerLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href={contactHref}
            className={styles.drawerCta}
            onClick={() => setOpen(false)}
          >
            {BROCHURE_QUOTE_CTA.label}
          </a>
        </nav>
      </div>
    </NavSurfaceHeader>
  );
}
