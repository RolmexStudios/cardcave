"use client";

import { useLayoutEffect, useRef } from "react";
import { videoSources, type VideoSource } from "@/components/shared/video-sources";
import styles from "./ambient-video.module.scss";

const bound = new WeakMap<HTMLVideoElement, () => void>();
let runtimeInstalled = false;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stripNativeUI(video: HTMLVideoElement) {
  if (video.controls || video.hasAttribute("controls")) {
    video.controls = false;
    video.removeAttribute("controls");
  }
}

function tryPlay(video: HTMLVideoElement) {
  if (prefersReducedMotion() || document.hidden) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  stripNativeUI(video);
  if (video.preload !== "auto") video.preload = "auto";
  void video.play().catch(() => {});
}

function bindAmbientVideo(video: HTMLVideoElement) {
  if (bound.has(video)) return;

  video.defaultMuted = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";
  video.tabIndex = -1;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  stripNativeUI(video);

  if (!video.hasAttribute("aria-hidden") && !video.getAttribute("aria-label")) {
    video.setAttribute("aria-hidden", "true");
  }

  const uiObserver = new MutationObserver(() => stripNativeUI(video));
  uiObserver.observe(video, { attributes: true, attributeFilter: ["controls"] });

  if (prefersReducedMotion()) {
    video.removeAttribute("autoplay");
    video.autoplay = false;
    try {
      video.pause();
    } catch {
      /* ignore */
    }
    bound.set(video, () => uiObserver.disconnect());
    return;
  }

  const inView = { current: false };
  const viewObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inView.current = entry.isIntersecting && entry.intersectionRatio > 0.08;
        if (inView.current) tryPlay(video);
        else video.pause();
      }
    },
    { threshold: [0, 0.08, 0.25], rootMargin: "20% 0px" },
  );
  viewObserver.observe(video);
  const rect = video.getBoundingClientRect();
  if (rect.bottom > 0 && rect.top < window.innerHeight) {
    inView.current = true;
    tryPlay(video);
  }

  const onReady = () => {
    if (inView.current) tryPlay(video);
  };
  video.addEventListener("loadeddata", onReady);
  video.addEventListener("canplay", onReady);

  bound.set(video, () => {
    uiObserver.disconnect();
    viewObserver.disconnect();
    video.removeEventListener("loadeddata", onReady);
    video.removeEventListener("canplay", onReady);
  });
}

function scan() {
  document.querySelectorAll<HTMLVideoElement>("video[data-ambient]").forEach(bindAmbientVideo);
}

function resumePaused() {
  if (prefersReducedMotion() || document.hidden) return;
  document.querySelectorAll<HTMLVideoElement>("video[data-ambient]").forEach((video) => {
    const rect = video.getBoundingClientRect();
    const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
    if (onScreen) tryPlay(video);
  });
}

function ensureAmbientRuntime() {
  if (runtimeInstalled || typeof document === "undefined") return;
  runtimeInstalled = true;
  scan();
  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  document.addEventListener("pointerdown", resumePaused, { passive: true });
  document.addEventListener("touchstart", resumePaused, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resumePaused();
  });
}

export type AmbientVideoProps = {
  src?: string;
  sources?: VideoSource[];
  className?: string;
  poster?: string;
  /** When set, the clip is exposed to assistive tech instead of aria-hidden. */
  label?: string;
};

/**
 * Background clip. Nothing is fetched until the plate is on screen, then
 * muted playback starts. That keeps Private Safari from stalling on five
 * videos at once, and avoids the first-frame still on iPhone.
 * Reduced motion leaves clips paused.
 */
export function AmbientVideo({
  src,
  sources,
  className,
  poster,
  label,
}: AmbientVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const list = sources ?? (src?.trim() ? videoSources(src) : []);

  useLayoutEffect(() => {
    const video = ref.current;
    if (!video) return;
    bindAmbientVideo(video);
    ensureAmbientRuntime();
    return () => {
      bound.get(video)?.();
      bound.delete(video);
    };
  }, [src, list.length]);

  return (
    <video
      ref={ref}
      className={[styles.video, className].filter(Boolean).join(" ")}
      poster={poster}
      data-ambient=""
      muted
      loop
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
      preload="none"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      tabIndex={-1}
    >
      {list.map((source) => (
        <source key={`${source.type}:${source.src}`} src={source.src} type={source.type} />
      ))}
    </video>
  );
}
