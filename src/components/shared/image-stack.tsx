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
const CYCLE_MS = 520;

type Pose = {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
};

type Flight = {
  id: string;
  extraX: number;
  lift: boolean;
  skip: boolean;
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

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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
  const [flight, setFlight] = useState<Flight | null>(null);
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
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  orderRef.current = order;

  if (deckTrack !== deckKey) {
    setDeckTrack(deckKey);
    setOrder(deck.map((frame) => frame.id));
    setOffset({ x: 0, dragging: false });
    setFlight(null);
    busyRef.current = false;
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      for (const timer of timersRef.current) window.clearTimeout(timer);
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

  function later(fn: () => void, ms: number) {
    const timer = window.setTimeout(fn, ms);
    timersRef.current.push(timer);
    return timer;
  }

  function commitSendToBack() {
    setOrder((prev) =>
      prev.length < 2 ? prev : [...prev.slice(1), prev[0]],
    );
  }

  function commitBringForward() {
    setOrder((prev) =>
      prev.length < 2 ? prev : [prev[prev.length - 1], ...prev.slice(0, -1)],
    );
  }

  function finishFlight() {
    setFlight(null);
    busyRef.current = false;
  }

  function sendToBack() {
    if (!canCycle || busyRef.current) return;
    if (prefersReducedMotion()) {
      commitSendToBack();
      return;
    }
    const id = orderRef.current[0];
    if (!id) return;
    busyRef.current = true;
    setFlight({ id, extraX: 168, lift: true, skip: false });
    later(() => {
      commitSendToBack();
      setFlight({ id, extraX: 168, lift: false, skip: true });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlight({ id, extraX: 0, lift: false, skip: false });
        });
      });
    }, CYCLE_MS);
    later(finishFlight, CYCLE_MS * 2);
  }

  function bringForward() {
    if (!canCycle || busyRef.current) return;
    if (prefersReducedMotion()) {
      commitBringForward();
      return;
    }
    const id = orderRef.current[orderRef.current.length - 1];
    if (!id) return;
    busyRef.current = true;
    commitBringForward();
    setFlight({ id, extraX: -168, lift: true, skip: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlight({ id, extraX: 0, lift: true, skip: false });
      });
    });
    later(finishFlight, CYCLE_MS);
  }

  function clearGestureFrame() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canCycle || busyRef.current) return;
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
          const flying = flight?.id === frame.id;
          const dragging = isTop && offset.dragging;
          const extraX = flying ? flight.extraX : isTop ? offset.x : 0;
          const skip = Boolean(flying && flight.skip);
          const style: CSSProperties = {
            zIndex: flying && flight.lift ? ordered.length + 2 : ordered.length - index,
            opacity: pose.opacity,
            transform: cardTransform(
              pose,
              extraX,
              dragging ? 1.04 : 1,
            ),
          };
          return (
            <div
              key={frame.id}
              className={styles.card}
              data-top={isTop ? "true" : undefined}
              data-dragging={dragging || skip ? "true" : undefined}
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
