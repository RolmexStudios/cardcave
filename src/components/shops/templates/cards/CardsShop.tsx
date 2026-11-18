"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/shared/section-heading";
import { FlipCard } from "@/components/shared/flip-card";
import { StaggerList } from "@/components/shared/stagger-list";
import { fieldPath } from "@/components/shared/field-path";
import { emptyShopBlueprint } from "@/components/shops/blueprint";
import {
  isListedItem,
  shopHref,
  shopItemHref,
} from "@/components/shops/data";
import type { BrochureBlockProps, BrochureShopContent } from "@/types/brochure";
import styles from "@/components/inventory/templates/cards/cards.module.scss";
import extra from "./cards-shop.module.scss";

function backPhoto(item: { imageUrl: string; images: string[]; backImageUrl: string }) {
  const explicit = item.backImageUrl.trim();
  if (explicit) return explicit;
  const cover = item.imageUrl.trim();
  return (
    item.images.find((url) => {
      const trimmed = url.trim();
      return trimmed && trimmed !== cover;
    })?.trim() ?? ""
  );
}

export function CardsShop({
  instanceId = "BrochureShop_1",
  data = emptyShopBlueprint(),
}: BrochureBlockProps<BrochureShopContent>) {
  const listed = useMemo(
    () =>
      data.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => isListedItem(item)),
    [data.items],
  );
  const limit = Math.max(1, data.teaserLimit);
  const preview = listed.slice(0, limit);
  const viewAll = data.viewAllLabel.trim();
  const [flippedId, setFlippedId] = useState<string | null>(null);

  return (
    <section
      id={instanceId}
      className={styles.section}
      aria-labelledby={`${instanceId}-title`}
    >
      <div className={styles.inner}>
        <header className={`${styles.header} ${extra.header}`}>
          <SectionHeading
            instanceId={instanceId}
            title={data.title}
            titleAs="h2"
            titleId={`${instanceId}-title`}
            eyebrowClassName={styles.eyebrow}
            titleClassName={styles.title}
          />
          {viewAll ? (
            <Link href={shopHref()} className={extra.viewAll}>
              {viewAll}
            </Link>
          ) : null}
        </header>

        {preview.length > 0 ? (
          <StaggerList
            className={`${styles.grid} ${extra.grid}`}
            playKey={preview.length}
          >
            {preview.map(({ item, index }) => {
              const title = item.title.trim() || item.brand.trim() || "Card";
              const key = item.id || `${instanceId}-${index}`;
              const backUrl = backPhoto(item);
              return (
                <li key={key}>
                  <FlipCard
                    className={`${styles.card} ${extra.card}`}
                    flipped={flippedId === key}
                    onToggle={() =>
                      setFlippedId((current) => (current === key ? null : key))
                    }
                    title={title}
                    frontUrl={item.imageUrl}
                    frontAlt={item.imageAlt.trim() || title}
                    frontSlotId={`${instanceId}-item-${index + 1}`}
                    frontJsonPath={fieldPath(instanceId, `items[${index}].imageUrl`)}
                    backUrl={backUrl}
                    backAlt={item.backImageAlt}
                    backSlotId={`${instanceId}-item-${index + 1}-back`}
                    backJsonPath={fieldPath(instanceId, `items[${index}].backImageUrl`)}
                    backText={item.backText.trim() || item.description}
                    kicker={[item.brand, item.category].filter((part) => part.trim()).join(" · ")}
                    price={item.price}
                    href={shopItemHref(item)}
                    hrefLabel="View"
                  />
                </li>
              );
            })}
          </StaggerList>
        ) : null}
      </div>
    </section>
  );
}
