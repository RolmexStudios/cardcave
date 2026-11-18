"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./stagger-list.module.scss";

export type StaggerListProps = {
  children: ReactNode;
  className?: string;
  /** Change this to replay the cascade (filters, new catalog, etc.). */
  playKey?: string | number;
  /** Left-to-right delay between cards on the same row. */
  delayMs?: number;
  /** Extra beat before the next row starts. */
  rowGapMs?: number;
  durationMs?: number;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function classNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function columnCount(element: HTMLElement): number {
  const items = Array.from(element.children) as HTMLElement[];
  if (items.length === 0) return 1;
  const top = items[0].offsetTop;
  let count = 0;
  for (const item of items) {
    if (Math.abs(item.offsetTop - top) > 1) break;
    count += 1;
  }
  return Math.max(1, count);
}

/**
 * Default list entrance: first item, then rightward along the row, then the
 * next row. Animate the list items, not the card face, so hover transforms
 * stay independent.
 */
export function StaggerList({
  children,
  className,
  playKey,
  delayMs = 64,
  rowGapMs = 90,
  durationMs = 720,
}: StaggerListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [columns, setColumns] = useState(1);
  const [play, setPlay] = useState(false);

  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const measure = () => {
      setColumns(columnCount(element));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [playKey]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    if (prefersReducedMotion()) {
      setPlay(true);
      return;
    }

    setPlay(false);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setPlay(true);
        observer.disconnect();
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [playKey]);

  const items = Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{
      className?: string;
      style?: CSSProperties;
    }>;
    const row = Math.floor(index / columns);
    return cloneElement(element, {
      className: classNames(styles.item, element.props.className),
      style: {
        ...element.props.style,
        "--stagger-index": String(index),
        "--stagger-row": String(row),
      } as CSSProperties,
    });
  });

  return (
    <ul
      ref={listRef}
      className={classNames(styles.list, className)}
      data-play={play ? "true" : undefined}
      style={
        {
          "--stagger-delay": `${delayMs}ms`,
          "--stagger-row-gap": `${rowGapMs}ms`,
          "--stagger-duration": `${durationMs}ms`,
        } as CSSProperties
      }
    >
      {items}
    </ul>
  );
}
