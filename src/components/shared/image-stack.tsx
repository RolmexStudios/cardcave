"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Photo } from "@/components/shared/media";
import styles from "./image-stack.module.scss";

export type ImageStackFrame = {
  id: string;
  src: string;
  alt: string;
};

export type ImageStackProps = {
  frames: ImageStackFrame[];
  className?: string;
  /** Accessible name for the deck, e.g. "Outerwear photos". */
  label?: string;
};

const FAN = 4;
const MIN_FLICK = 56;

type Pose = {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
};

function fanPose(index: number): Pose {
  const i = Math.min(index, FAN - 1);
  return {
    x: i * -12,
    y: i * -8,
    rotate: i === 0 ? 0 : -(2 + i * 2.4),
    opacity: index >= FAN ? 0 : 1,
  };
}

function cardTransform(pose: Pose, extraX = 0, scale = 1) {
  const rotate = pose.rotate + extraX / 18;
  return `translate3d(${pose.x + extraX}px, ${pose.y}px, 0) rotate(${rotate}deg) scale(${scale})`;
}

function rubber(value: number, limit = 150) {
  const sign = Math.sign(value);
  const abs = Math.abs(value);
  if (abs <= limit) return value;
  return sign * (limit + (abs - limit) * 0.2);
}

export function ImageStack({
  frames,
  className,
  label = "Photos",
}: ImageStackProps) {
  const deck = frames.filter((frame) => frame.id);
  const deckKey = deck.map((frame) => frame.id).join("|");
  const [order, setOrder] = useState<string[]>(() => deck.map((frame) => frame.id));
  const [deckTrack, setDeckTrack] = useState(deckKey);
  const [offset, setOffset] = useState({ x: 0, dragging: false });
  const gesture = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    x: number;
    y: number;
  } | null>(null);
  const gestureEpoch = useRef(0);
  const frameRef = useRef(0);
  const orderRef = useRef(order);
  orderRef.current = order;

  if (deckTrack !== deckKey) {
    setDeckTrack(deckKey);
    setOrder(deck.map((frame) => frame.id));
    setOffset({ x: 0, dragging: false });
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const byId = new Map(deck.map((frame) => [frame.id, frame]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((frame): frame is ImageStackFrame => Boolean(frame));
  const top = ordered[0];
  const position = Math.max(
    1,
    deck.findIndex((frame) => frame.id === top?.id) + 1,
  );
  const canCycle = ordered.length > 1;

  function sendToBack() {
    setOrder((prev) =>
      prev.length < 2 ? prev : [...prev.slice(1), prev[0]],
    );
  }

  function bringForward() {
    setOrder((prev) =>
      prev.length < 2 ? prev : [prev[prev.length - 1], ...prev.slice(0, -1)],
    );
  }

  function clearGestureFrame() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canCycle) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gesture.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      x: 0,
      y: 0,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is optional. Moves still update the gesture while the pointer stays on the card.
    }
    setOffset({ x: 0, dragging: true });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const dx = event.clientX - current.originX;
    const dy = event.clientY - current.originY;
    current.x = dx;
    current.y = dy;
    const nextX =
      Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12 ? 0 : rubber(dx);
    const epoch = gestureEpoch.current;
    clearGestureFrame();
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      if (gestureEpoch.current !== epoch || !gesture.current) return;
      setOffset({ x: nextX, dragging: true });
    });
  }

  function finishGesture(event: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const { x, y } = current;
    gesture.current = null;
    gestureEpoch.current += 1;
    clearGestureFrame();
    const flick =
      commit &&
      orderRef.current.length > 1 &&
      Math.abs(x) >= MIN_FLICK &&
      Math.abs(x) > Math.abs(y);
    setOffset({ x: 0, dragging: false });
    if (flick) sendToBack();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canCycle) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      sendToBack();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      bringForward();
    }
  }

  if (!top) return null;

  const summary = top.alt.trim()
    ? `${top.alt.trim()}. Photo ${position} of ${ordered.length}.`
    : `Photo ${position} of ${ordered.length}.`;

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <div
        className={styles.stage}
        role="group"
        tabIndex={0}
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        {ordered.map((frame, index) => {
          const pose = fanPose(index);
          const isTop = index === 0;
          const dragging = isTop && offset.dragging;
          const style: CSSProperties = {
            zIndex: ordered.length - index,
            opacity: pose.opacity,
            transform: cardTransform(
              pose,
              isTop ? offset.x : 0,
              dragging ? 1.04 : 1,
            ),
          };
          return (
            <div
              key={frame.id}
              className={styles.card}
              data-top={isTop ? "true" : undefined}
              data-dragging={dragging ? "true" : undefined}
              style={style}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? (event) => finishGesture(event, true) : undefined}
              onPointerCancel={
                isTop ? (event) => finishGesture(event, false) : undefined
              }
              onDragStart={(event) => event.preventDefault()}
            >
              <div className={styles.face}>
                <Photo
                  src={frame.src}
                  alt={isTop ? frame.alt : ""}
                  className={styles.image}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.live} aria-live="polite">
        {summary}
      </p>

      {canCycle ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            aria-label="Previous photo"
            onClick={bringForward}
          >
            <ChevronLeft aria-hidden />
          </button>
          <span className={styles.count} aria-hidden>
            {position} / {ordered.length}
          </span>
          <button
            type="button"
            className={styles.control}
            aria-label="Next photo"
            onClick={sendToBack}
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
