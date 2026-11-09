"use client";

import { useRef } from "react";
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
  const rowRef = useRef<HTMLDivElement>(null);
  useSmoothHorizontalWheelScroll(rowRef, groups.length > 1, {
    mapVertical: false,
  });

  if (groups.length === 0) return null;

  return (
    <div className={styles.root}>
      <div
        ref={rowRef}
        className={styles.row}
        data-count={Math.min(groups.length, 4)}
        data-smooth-wheel=""
      >
        {groups.map((group) => {
          const countLabel = group.count === 1 ? "1 piece" : `${group.count} pieces`;
          return (
            <article key={group.slug} className={styles.column}>
              <h3 className={styles.solo}>{group.name}</h3>
              <p className={styles.count}>{countLabel}</p>
              <ImageStack
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
            </article>
          );
        })}
      </div>
    </div>
  );
}
