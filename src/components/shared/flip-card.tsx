"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FlipHorizontal2 } from "lucide-react";
import { MediaSlot } from "@/components/shared/media";
import { Hover3d } from "@/components/shared/hover-3d";
import { publicPrice } from "@/components/shared/price";
import styles from "./flip-card.module.scss";

export type FlipCardProps = {
  className?: string;
  flipped: boolean;
  onToggle: () => void;
  title: string;
  frontUrl: string;
  frontAlt: string;
  frontSlotId: string;
  frontJsonPath: string;
  backUrl?: string;
  backAlt?: string;
  backSlotId?: string;
  backJsonPath?: string;
  backText?: string;
  kicker?: string;
  price?: string;
  href?: string;
  hrefLabel?: string;
};

function classNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function FlipMark() {
  return (
    <span className={styles.flipMark} aria-hidden>
      <FlipHorizontal2 strokeWidth={2.25} />
      Flip
    </span>
  );
}

/**
 * Tilted trading-card face that flips on click. The back is a second photo
 * from the blueprint, or a written panel when that photo is blank.
 */
export function FlipCard({
  className,
  flipped,
  onToggle,
  title,
  frontUrl,
  frontAlt,
  frontSlotId,
  frontJsonPath,
  backUrl = "",
  backAlt = "",
  backSlotId,
  backJsonPath,
  backText = "",
  kicker = "",
  price = "",
  href = "",
  hrefLabel = "View",
}: FlipCardProps) {
  const backPhoto = backUrl.trim();
  const note = backText.trim();
  const detailsHref = href.trim();

  let back: ReactNode;
  if (backPhoto) {
    back = (
      <>
        <MediaSlot
          url={backPhoto}
          slotId={backSlotId || `${frontSlotId}-back`}
          jsonPath={backJsonPath || frontJsonPath}
          alt={backAlt.trim() || `${title} back`}
          className={styles.image}
        />
        <FlipMark />
      </>
    );
  } else {
    back = (
      <div className={styles.panel}>
        {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
        <p className={styles.title}>{title}</p>
        {note ? <p className={styles.text}>{note}</p> : null}
        {publicPrice(price) ? <p className={styles.price}>{publicPrice(price)}</p> : null}
        <FlipMark />
      </div>
    );
  }

  return (
    <div className={classNames(styles.wrap, className)}>
      <Hover3d
        className={styles.tilt}
        ariaLabel={
          flipped ? `${title}, back. Click to flip back.` : `${title}. Click to flip.`
        }
        pressed={flipped}
        onClick={() => onToggle()}
      >
        <div className={styles.shell} data-flipped={flipped ? "true" : undefined}>
          <div className={styles.inner}>
            <div className={styles.front} inert={flipped || undefined}>
              <MediaSlot
                url={frontUrl}
                slotId={frontSlotId}
                jsonPath={frontJsonPath}
                alt={frontAlt}
                className={styles.image}
              />
              <FlipMark />
            </div>
            <div className={styles.back} inert={!flipped || undefined}>
              {back}
            </div>
          </div>
        </div>
      </Hover3d>
      {flipped && detailsHref ? (
        <Link href={detailsHref} className={styles.link}>
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}
