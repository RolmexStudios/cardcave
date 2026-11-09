"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { emptyShopBlueprint } from "@/components/shops/blueprint";
import { CategoryIndex } from "@/components/shops/category-index";
import { ProductCard } from "@/components/shops/product-card";
import {
  isListedItem,
  shopCategoryGroups,
  shopHref,
  shopItemHref,
} from "@/components/shops/data";
import type { BrochureBlockProps, BrochureShopContent } from "@/types/brochure";
import styles from "./rail.module.scss";

export function RailShop({
  instanceId = "BrochureShop_1",
  data = emptyShopBlueprint(),
}: BrochureBlockProps<BrochureShopContent>) {
  const limit = Math.max(1, data.teaserLimit);
  const preview = data.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isListedItem(item))
    .slice(0, limit);
  const viewAll = data.viewAllLabel.trim();
  const categories = shopCategoryGroups(data.items);

  return (
    <>
      <CategoryIndex
        instanceId={instanceId}
        title={data.categoriesTitle}
        groups={categories}
        layout={data.categoriesLayout}
        viewLabel={data.viewCategoryLabel}
      />
      <section
        id={instanceId}
        className={styles.section}
        data-bg="#ffffff"
        data-theme="light"
        data-nav="on-light"
        aria-labelledby={`${instanceId}-title`}
      >
        <ScrollReveal compact>
          <header className={styles.header}>
            <SectionHeading
              instanceId={instanceId}
              title={data.title}
              titleAs="h2"
              titleId={`${instanceId}-title`}
              className={styles.heading}
              eyebrowClassName={styles.eyebrow}
              titleClassName={styles.title}
            />
            {viewAll ? (
              <Link href={shopHref()} className={styles.viewAll}>
                {viewAll}
              </Link>
            ) : null}
          </header>
        </ScrollReveal>

        <ScrollReveal compact delayMs={80}>
          <ul className={styles.track}>
            {preview.map(({ item, index }) => (
              <li key={`${item.id || "item"}-${index}`} className={styles.item}>
                <ProductCard
                  item={item}
                  instanceId={instanceId}
                  index={index}
                  href={shopItemHref(item)}
                />
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </section>
    </>
  );
}
