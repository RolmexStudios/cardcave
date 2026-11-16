"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { cropImageBlob, imagePixelSize } from "@/lib/admin/crop-image";
import { uploadImage } from "@/lib/admin/api";
import { rewriteMediaUrl } from "@/lib/admin/media-url";
import { useBrochureStore } from "@/lib/admin/store";
import styles from "./admin.module.scss";

type Aspect = number | undefined;

const ASPECTS: { label: string; value: Aspect }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const store = useBrochureStore();
  const preview = store?.site ? rewriteMediaUrl(value, store.site.adminApi) : value;
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<Aspect>(undefined);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  function pickFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setError("");
    setSource((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  async function confirmCrop() {
    if (!source) {
      return;
    }
    if (!store?.site || !store.token) {
      setError("Sign in to upload photos.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const pixels =
        area ??
        ({ x: 0, y: 0, ...(await imagePixelSize(source)) } as Area);
      if (pixels.width < 1 || pixels.height < 1) {
        throw new Error("Could not read that photo");
      }
      const blob = await cropImageBlob(source, pixels);
      const url = await uploadImage(store.site, store.token, blob);
      onChange(url);
      URL.revokeObjectURL(source);
      setSource(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.field}>
      <span>{label}</span>
      {preview ? (
        // Uploaded media can be any host the Worker returns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className={styles.preview}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className={styles.row}>
        <FilePickButton label={value ? "Replace" : "Choose photo"} onPick={pickFile} />
        <FilePickButton
          label="Take photo"
          capture="environment"
          onPick={pickFile}
        />
        {value ? (
          <button type="button" className={styles.ghost} onClick={() => onChange("")}>
            Remove
          </button>
        ) : null}
      </div>
      {source ? (
        <div className={styles.scrim} onClick={() => setSource(null)}>
          <div
            className={`${styles.modal} ${styles.cropModal}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 className={styles.title}>Crop image</h2>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.cropWrap}>
                <Cropper
                  image={source}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className={styles.row}>
                {ASPECTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={styles.itemButton}
                    data-active={aspect === item.value ? "true" : undefined}
                    onClick={() => setAspect(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {error ? <p className={styles.error}>{error}</p> : null}
            </div>
            <div className={styles.modalFoot}>
              <button type="button" className={styles.ghost} onClick={() => setSource(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={busy}
                onClick={confirmCrop}
              >
                {busy ? "Uploading…" : "Use photo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {error && !source ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function FilePickButton({
  label,
  capture,
  className,
  onPick,
}: {
  label: string;
  capture?: "user" | "environment";
  className?: string;
  onPick: (file: File | undefined) => void;
}) {
  return (
    <label className={`${styles.itemButton} ${className ?? ""}`.trim()}>
      {label}
      <input
        type="file"
        accept="image/*"
        capture={capture}
        className={styles.fileInput}
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}
