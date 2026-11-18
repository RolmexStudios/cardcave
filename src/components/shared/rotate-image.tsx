"use client";

import { RotateCw } from "lucide-react";
import styles from "./rotate-image.module.scss";

export function cycleTurn(turn: number) {
  return (turn + 1) % 4;
}

export function RotateImageButton({
  onRotate,
  className,
}: {
  onRotate: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(" ")}
      aria-label="Rotate image"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRotate();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <RotateCw aria-hidden />
    </button>
  );
}
