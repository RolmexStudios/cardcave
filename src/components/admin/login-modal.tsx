"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminApiError } from "@/lib/admin/api";
import styles from "./admin.module.scss";

const SUBMIT_GAP_MS = 1500;

export function LoginModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [lastSubmit, setLastSubmit] = useState(0);

  const remainingMs = Math.max(0, lockedUntil - now);
  const locked = remainingMs > 0;
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));

  useEffect(() => {
    if (!locked) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [locked]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || locked) return;
    if (Date.now() - lastSubmit < SUBMIT_GAP_MS) {
      setError("Wait a moment before trying again.");
      return;
    }
    setBusy(true);
    setError("");
    setLastSubmit(Date.now());
    try {
      await onSubmit(username, password);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 429) {
        const wait = (err.retryAfter ?? 15 * 60) * 1000;
        setLockedUntil(Date.now() + wait);
        setError(
          `Too many sign-in attempts. Try again in ${Math.max(1, Math.ceil(wait / 60000))} minutes.`,
        );
      } else {
        setError(err instanceof Error ? err.message : "Could not sign in");
      }
      setBusy(false);
    }
  }

  return (
    <div className={styles.scrim} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.modalHead}>
          <div>
            <h2 className={styles.title}>Sign in</h2>
            <p className={styles.hint}>Use the credentials we sent you.</p>
          </div>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.field}>
            <span>Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={locked}
            />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={locked}
            />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          {locked ? (
            <p className={styles.hint}>
              Sign-in is paused for about {remainingMinutes} minute
              {remainingMinutes === 1 ? "" : "s"} to stop password guessing.
            </p>
          ) : null}
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.primary} disabled={busy || locked}>
            {busy ? "Signing in…" : locked ? "Paused" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
