"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImageStack, type ImageStackFrame } from "@/components/shared/image-stack";
import { TextSlot } from "@/components/shared/text-slot";
import { fieldPath } from "@/components/shared/field-path";
import { useSmoothHorizontalWheelScroll } from "@/components/shared/smooth-horizontal-wheel";
import { shopCategoryHref, type ShopCategoryGroup } from "@/components/shops/data";
import styles from "./category-stack.module.scss";

type CategoryStackProps = {
  instanceId: string;
  groups: ShopCategoryGroup[];
  viewLabel: string;
};

function framesFor(group: ShopCategoryGroup): ImageStackFrame[] {
  if (group.photos.length === 0) {
    return [{ id: `${group.slug}-empty`, src: "", alt: group.name }];
  }
  return group.photos.map((photo, index) => ({
    id: `${group.slug}-${index}-${photo.src}`,
    src: photo.src,
    alt: photo.alt,
  }));
}

export function CategoryStack({
  instanceId,
  groups,
  viewLabel,
}: CategoryStackProps) {
  const [active, setActive] = useState(0);
  const typesRef = useRef<HTMLElement>(null);
  const index = Math.min(active, Math.max(groups.length - 1, 0));
  const group = groups[index];
  useSmoothHorizontalWheelScroll(typesRef, groups.length > 1, {
    mapVertical: false,
  });

  if (!group) return null;

  const countLabel = group.count === 1 ? "1 piece" : `${group.count} pieces`;

  return (
    <div className={styles.root}>
      {groups.length > 1 ? (
        <nav
          ref={typesRef}
          className={styles.types}
          aria-label="Shop by type"
          data-smooth-wheel=""
        >
          {groups.map((entry, entryIndex) => {
            const selected = entryIndex === index;
            return (
              <button
                key={entry.slug}
                type="button"
                className={styles.type}
                aria-current={selected ? "true" : undefined}
                onClick={() => setActive(entryIndex)}
              >
                {entry.name}
              </button>
            );
          })}
        </nav>
      ) : (
        <p className={styles.solo}>{group.name}</p>
      )}

      <p className={styles.count}>{countLabel}</p>

      <ImageStack
        key={group.slug}
        frames={framesFor(group)}
        label={`${group.name} photos`}
      />

      <Link
        href={shopCategoryHref(group.name)}
        className={styles.more}
      >
        <TextSlot
          value={viewLabel}
          jsonPath={fieldPath(instanceId, "viewCategoryLabel")}
          as="span"
        />
        <span className={styles.srOnly}>{group.name}</span>
      </Link>
    </div>
  );
}
