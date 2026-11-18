import Link from "next/link";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import styles from "./hover-3d.module.scss";

const ZONE_COUNT = 8;

type Hover3dProps = {
  children: ReactNode;
  className?: string;
  /** When set, the whole card is a link. Do not put buttons or links inside. */
  href?: string;
  ariaLabel?: string;
  /** Click handler for flip/toggle. Do not combine with `href`. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  pressed?: boolean;
  /**
   * Let clicks pass through the tilt zones to links on the card.
   * The zones only exist so hover can tilt; they should not cover a control.
   */
  passthrough?: boolean;
};

function zones() {
  return Array.from({ length: ZONE_COUNT }, (_, index) => (
    <div key={index} aria-hidden />
  ));
}

function classNames(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * DaisyUI-style 3D tilt wrapper. First child is the card face; eight empty
 * hover zones drive the tilt. Put the wrapper on a link when the card
 * itself should be clickable, or pass `onClick` to toggle (e.g. flip).
 */
export function Hover3d({
  children,
  className,
  href,
  ariaLabel,
  onClick,
  pressed,
  passthrough = false,
}: Hover3dProps) {
  const classNameValue = classNames(
    styles.root,
    onClick && !href && styles.pressable,
    passthrough && styles.passthrough,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classNameValue} aria-label={ariaLabel}>
        {children}
        {zones()}
      </Link>
    );
  }

  if (onClick) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("a[href]")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onClick(event as unknown as MouseEvent<HTMLElement>);
    };
    return (
      <div
        className={classNameValue}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={pressed}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {children}
        {zones()}
      </div>
    );
  }

  return (
    <div className={classNameValue}>
      {children}
      {zones()}
    </div>
  );
}
