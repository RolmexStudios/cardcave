"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { ImageLightbox, type LightboxImage } from "@/components/shared/image-lightbox";
import { MediaSlot } from "@/components/shared/media";
import { FlipCard } from "@/components/shared/flip-card";
import { StaggerList } from "@/components/shared/stagger-list";
import { cycleTurn, RotateImageButton } from "@/components/shared/rotate-image";
import { visiblePrice } from "@/components/shared/price";
import { sendBrochureInquiry, whatsappHref } from "@/components/shared/form-submit";
import { EditChip } from "@/components/admin/edit-chip";
import adminStyles from "@/components/admin/admin.module.scss";
import { ShowroomChrome } from "@/components/inventory/page-chrome";
import {
  INVENTORY_INSTANCE_ID,
  SLAB_STATUS_LABELS,
  showroomHref,
  slabGradeLabel,
  vehicleCoverUrl,
  vehicleHref,
  vehicleSlug,
  vehicleTitle,
  vehicleToSlab,
} from "@/components/inventory/data";
import type { BrochureVehicle } from "@/types/brochure";
import styles from "./slab-view.module.scss";

type SlabViewProps = {
  vehicle: BrochureVehicle;
  catalog: BrochureVehicle[];
  businessName: string;
  logoUrl?: string;
  inquiryEmail: string;
  whatsapp: string;
};

type SubmitState = "idle" | "sending" | "sent" | "error";

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function suggest(current: BrochureVehicle, catalog: BrochureVehicle[]) {
  const self = vehicleSlug(current);
  const mine = vehicleToSlab(current);
  const others = catalog.filter((vehicle) => vehicleSlug(vehicle) !== self);
  const scored = others
    .map((vehicle) => {
      const slab = vehicleToSlab(vehicle);
      let score = 0;
      if (mine.sport && slab.sport === mine.sport) score += 4;
      if (mine.grader && slab.grader === mine.grader) score += 3;
      if (mine.set && slab.set === mine.set) score += 2;
      if (mine.grade && slab.grade === mine.grade) score += 2;
      if (mine.year && slab.year === mine.year) score += 1;
      return { vehicle, score };
    })
    .sort((a, b) => b.score - a.score || vehicleSlug(a.vehicle).localeCompare(vehicleSlug(b.vehicle)));

  const picked = scored.filter((row) => row.score > 0).slice(0, 7).map((row) => row.vehicle);
  if (picked.length >= 7) return picked;

  const used = new Set(picked.map((vehicle) => vehicleSlug(vehicle)));
  const rest = others
    .filter((vehicle) => !used.has(vehicleSlug(vehicle)))
    .sort(
      (a, b) =>
        hashText(`${self}:${vehicleSlug(a)}`) - hashText(`${self}:${vehicleSlug(b)}`),
    );
  return [...picked, ...rest.slice(0, 7 - picked.length)];
}

export function SlabView({
  vehicle,
  catalog,
  businessName,
  logoUrl,
  inquiryEmail,
  whatsapp,
}: SlabViewProps) {
  const title = vehicleTitle(vehicle) || "Card";
  const slug = vehicleSlug(vehicle);
  const slab = vehicleToSlab(vehicle);
  const sold = slab.status === "sold" || slab.status === "traded";
  const [selected, setSelected] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [turns, setTurns] = useState<Record<string, number>>({});
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const frames = useMemo<LightboxImage[]>(() => {
    const cover = vehicleCoverUrl(vehicle);
    const urls = [
      cover,
      ...vehicle.galleryImageUrls,
      vehicle.backImageUrl,
    ];
    const seen = new Set<string>();
    const next: LightboxImage[] = [];
    urls.forEach((url, index) => {
      const trimmed = url.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      next.push({
        url: trimmed,
        alt: vehicle.imageAlt.trim() || title,
        slotId: `${INVENTORY_INSTANCE_ID}_${slug}_${index + 1}`,
        jsonPath:
          trimmed === cover
            ? `${INVENTORY_INSTANCE_ID}.vehicles[].imageUrl`
            : `${INVENTORY_INSTANCE_ID}.vehicles[].galleryImageUrls`,
      });
    });
    return next;
  }, [slug, title, vehicle]);

  const safeSelected = frames.length ? Math.min(selected, frames.length - 1) : 0;
  const current = frames[safeSelected];
  const suggestions = useMemo(() => suggest(vehicle, catalog), [catalog, vehicle]);
  const price = visiblePrice(vehicle.price);
  const facts = [
    { label: "Year", value: slab.year },
    { label: "Set", value: slab.set },
    { label: "Sport", value: slab.sport },
    { label: "Grading company", value: slab.grader },
    { label: "Grade", value: slab.grade },
    { label: "Cert", value: slab.cert },
    {
      label: "Availability",
      value: SLAB_STATUS_LABELS[slab.status] ?? slab.status,
    },
    { label: "Price", value: price },
  ].filter((fact) => fact.value.trim());

  const wa = whatsappHref(whatsapp, `Hello — I would like to enquire about ${title}.`);

  return (
    <ShowroomChrome businessName={businessName} logoUrl={logoUrl}>
      <article className={styles.page}>
        <EditChip
          instanceId={INVENTORY_INSTANCE_ID}
          className={adminStyles.editChip}
        />
        <div className={styles.inner}>
          <Link href={showroomHref()} className={styles.back}>
            <ArrowLeft className={styles.backIcon} aria-hidden />
            Inventory
          </Link>

          <div className={styles.layout}>
            <div className={styles.media}>
              {current ? (
                <div className={styles.stageWrap}>
                  <button
                    type="button"
                    className={styles.stage}
                    onClick={() => setLightboxIndex(safeSelected)}
                    aria-label={`View ${title}`}
                  >
                    <MediaSlot
                      url={current.url}
                      slotId={current.slotId}
                      jsonPath={current.jsonPath}
                      alt={current.alt}
                      className={styles.image}
                      turn={turns[current.url] ?? 0}
                    />
                  </button>
                  <RotateImageButton
                    className={styles.rotate}
                    onRotate={() =>
                      setTurns((currentTurns) => ({
                        ...currentTurns,
                        [current.url]: cycleTurn(currentTurns[current.url] ?? 0),
                      }))
                    }
                  />
                </div>
              ) : null}

              {frames.length > 1 ? (
                <ul className={styles.thumbs}>
                  {frames.map((frame, index) => (
                    <li key={frame.slotId}>
                      <button
                        type="button"
                        className={styles.thumb}
                        aria-current={index === safeSelected ? "true" : undefined}
                        aria-label={`Photo ${index + 1} of ${frames.length}`}
                        onClick={() => setSelected(index)}
                      >
                        <MediaSlot
                          url={frame.url}
                          slotId={`${frame.slotId}-thumb`}
                          jsonPath={frame.jsonPath}
                          alt=""
                          className={styles.thumbImage}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className={styles.copy}>
              {slabGradeLabel(slab) ? (
                <p className={styles.kicker}>{slabGradeLabel(slab)}</p>
              ) : null}
              <h1 className={styles.title}>{title}</h1>
              {sold ? <p className={styles.sold}>{SLAB_STATUS_LABELS[slab.status]}</p> : null}
              {vehicle.description.trim() ? (
                <div className={styles.description}>
                  {vehicle.description
                    .split(/\n\s*\n/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>
              ) : null}
              {facts.length > 0 ? (
                <dl className={styles.details}>
                  {facts.map((fact) => (
                    <div key={fact.label} className={styles.row}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <Inquiry
                title={title}
                inquiryEmail={inquiryEmail}
                whatsappLink={wa}
                businessName={businessName}
              />
            </div>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <section className={styles.suggested} aria-labelledby={`${slug}-suggested`}>
            <h2 id={`${slug}-suggested`} className={styles.suggestedTitle}>
              Suggested
            </h2>
            <StaggerList className={styles.suggestedGrid} playKey={suggestions.length}>
              {suggestions.map((item) => {
                const itemSlab = vehicleToSlab(item);
                const itemTitle = vehicleTitle(item) || "Card";
                const key = vehicleSlug(item);
                return (
                  <li key={key}>
                    <FlipCard
                      className={styles.card}
                      flipped={flippedId === key}
                      onToggle={() =>
                        setFlippedId((currentId) => (currentId === key ? null : key))
                      }
                      title={itemTitle}
                      frontUrl={vehicleCoverUrl(item)}
                      frontAlt={item.imageAlt.trim() || itemTitle}
                      frontSlotId={`${INVENTORY_INSTANCE_ID}_${key}`}
                      frontJsonPath={`${INVENTORY_INSTANCE_ID}.vehicles[].imageUrl`}
                      backUrl={item.backImageUrl}
                      backAlt={item.backImageAlt}
                      backText={item.backText.trim() || item.description}
                      kicker={[itemSlab.year, itemSlab.set, itemSlab.sport]
                        .filter((part) => part.trim())
                        .join(" · ")}
                      price={item.price}
                      href={vehicleHref(item)}
                      hrefLabel="View"
                    />
                  </li>
                );
              })}
            </StaggerList>
          </section>
        ) : null}
      </article>

      {lightboxIndex !== null && frames.length > 0 ? (
        <ImageLightbox
          images={frames}
          index={lightboxIndex}
          title={title}
          tone="paper"
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </ShowroomChrome>
  );
}

function Inquiry({
  title,
  inquiryEmail,
  whatsappLink,
  businessName,
}: {
  title: string;
  inquiryEmail: string;
  whatsappLink?: string;
  businessName: string;
}) {
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if ((data.get("company") as string)?.trim()) {
      setState("sent");
      form.reset();
      return;
    }
    const name = (data.get("name") as string)?.trim() ?? "";
    const email = (data.get("email") as string)?.trim() ?? "";
    const message = (data.get("message") as string)?.trim() ?? "";
    setState("sending");
    try {
      await sendBrochureInquiry(
        inquiryEmail,
        {
          Name: name,
          Email: email,
          Card: title,
          Message: message || "(no message)",
        },
        {
          subject: `${businessName.trim() || "Inventory"} — inquiry: ${title}`,
          replyTo: email,
        },
      );
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className={styles.sent} role="status">
        Your note about {title} is in. We will get back to you.
      </p>
    );
  }

  return (
    <form className={styles.inquiry} onSubmit={handleSubmit}>
      <h2 className={styles.inquiryTitle}>Inquire</h2>
      <div className={styles.honeypot} aria-hidden>
        <label htmlFor="slab-company">Company</label>
        <input id="slab-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <label className={styles.field}>
        <span>Name</span>
        <input name="name" type="text" required autoComplete="name" />
      </label>
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className={styles.field}>
        <span>Message</span>
        <textarea name="message" rows={3} defaultValue={`I would like to inquire about ${title}.`} />
      </label>
      {whatsappLink ? (
        <a className={styles.whatsapp} href={whatsappLink} target="_blank" rel="noreferrer">
          Message on WhatsApp
        </a>
      ) : null}
      {state === "error" ? (
        <p className={styles.error} role="alert">
          That did not send. Try again in a moment.
        </p>
      ) : null}
      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
