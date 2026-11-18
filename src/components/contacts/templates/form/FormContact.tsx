"use client";

import { useState, type FormEvent } from "react";
import { telHref } from "@/components/shared/media";
import { TextSlot } from "@/components/shared/text-slot";
import { SectionHeading } from "@/components/shared/section-heading";
import { fieldPath } from "@/components/shared/field-path";
import { sendBrochureInquiry } from "@/components/shared/form-submit";
import { emptyContactBlueprint } from "@/components/contacts/blueprint";
import { SocialLinks } from "@/components/contacts/social-links";
import type {
  BrochureBlockProps,
  BrochureContactContent,
  BrochureContactLink,
} from "@/types/brochure";
import styles from "./form.module.scss";

type SubmitState = "idle" | "sending" | "sent" | "error";

function isInstagram(link: BrochureContactLink) {
  return `${link.label} ${link.href}`.toLowerCase().includes("instagram");
}

function InstagramMark() {
  return (
    <svg className={styles.instagramIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm6.25-.75a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 9.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z"
      />
    </svg>
  );
}

export function FormContact({
  instanceId = "BrochureContact_1",
  data = emptyContactBlueprint(),
}: BrochureBlockProps<BrochureContactContent>) {
  const call = telHref(data.phone);
  const [state, setState] = useState<SubmitState>("idle");
  const showForm = data.channels !== "social";
  const showSocial = data.channels !== "form";
  const links = (data.links ?? []).filter((link) => link.href.trim());
  const instagram = links.find(isInstagram);
  const otherLinks = links.filter((link) => !isInstagram(link));
  const phone = data.phone.trim();
  const area = data.serviceArea.trim();
  const hours = data.hours.trim();
  const hasFacts = Boolean(phone || area || hours);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    if ((payload.get("company") as string)?.trim()) {
      setState("sent");
      form.reset();
      return;
    }
    const name = (payload.get("name") as string)?.trim() ?? "";
    const email = (payload.get("email") as string)?.trim() ?? "";
    const message = (payload.get("message") as string)?.trim() ?? "";
    if (!data.email.trim()) {
      setState("sent");
      form.reset();
      return;
    }
    setState("sending");
    try {
      await sendBrochureInquiry(
        data.email,
        {
          Name: name,
          Email: email,
          Message: message || "(no message)",
        },
        {
          subject: data.mailtoSubject.trim() || `${data.title.trim() || "Contact"} — new message`,
          replyTo: email,
        },
      );
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <section id={instanceId} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.panel} data-form={showForm ? "on" : "off"}>
          <div className={styles.copy}>
            <SectionHeading
              instanceId={instanceId}
              eyebrow={data.eyebrow}
              title={data.title}
              titleId={`${instanceId}-title`}
              eyebrowClassName={styles.eyebrow}
              titleClassName={styles.title}
              titleInnerClassName={styles.titleText}
            />
            <TextSlot
              value={data.intro}
              jsonPath={fieldPath(instanceId, "intro")}
              as="p"
              className={styles.intro}
            />

            {showSocial && instagram ? (
              <a
                className={styles.instagram}
                href={instagram.href.trim()}
                target="_blank"
                rel="noreferrer"
              >
                <InstagramMark />
                <span>{instagram.label.trim() || "Instagram"}</span>
              </a>
            ) : null}

            {showSocial && otherLinks.length > 0 ? (
              <SocialLinks links={otherLinks} />
            ) : null}

            {hasFacts ? (
              <dl className={styles.facts}>
                {phone ? (
                  <div className={styles.fact}>
                    <dt>Phone</dt>
                    <dd>
                      {call ? (
                        <a href={call} className={styles.factLink}>
                          {phone}
                        </a>
                      ) : (
                        <TextSlot
                          value={data.phone}
                          jsonPath={fieldPath(instanceId, "phone")}
                          as="span"
                        />
                      )}
                    </dd>
                  </div>
                ) : null}
                {area ? (
                  <div className={styles.fact}>
                    <dt>Area</dt>
                    <dd>
                      <TextSlot
                        value={data.serviceArea}
                        jsonPath={fieldPath(instanceId, "serviceArea")}
                        as="span"
                      />
                    </dd>
                  </div>
                ) : null}
                {hours ? (
                  <div className={styles.fact}>
                    <dt>Hours</dt>
                    <dd>
                      <TextSlot
                        value={data.hours}
                        jsonPath={fieldPath(instanceId, "hours")}
                        as="span"
                      />
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>

          {showForm ? (
            <div className={styles.formCol}>
              {state === "sent" ? (
                <div className={styles.success} role="status">
                  <p className={styles.successTitle}>Message received.</p>
                  <p className={styles.successBody}>We will get back to you.</p>
                </div>
              ) : (
                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                  <p className={styles.formLead}>Send a note</p>
                  <div className={styles.honeypot} aria-hidden>
                    <label htmlFor={`${instanceId}-company`}>Company</label>
                    <input
                      id={`${instanceId}-company`}
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.row}>
                    <label className={styles.field} htmlFor={`${instanceId}-name`}>
                      <span>Name</span>
                      <input
                        id={`${instanceId}-name`}
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                      />
                    </label>
                    <label className={styles.field} htmlFor={`${instanceId}-email`}>
                      <span>Email</span>
                      <input
                        id={`${instanceId}-email`}
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                      />
                    </label>
                  </div>
                  <label className={styles.field} htmlFor={`${instanceId}-message`}>
                    <span>Message</span>
                    <textarea
                      id={`${instanceId}-message`}
                      name="message"
                      required
                      rows={5}
                    />
                  </label>
                  {state === "error" ? (
                    <p className={styles.error} role="alert">
                      That did not send. Try again in a moment.
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    className={styles.submit}
                    disabled={state === "sending"}
                  >
                    {state === "sending"
                      ? "Sending…"
                      : data.ctaLabel.trim() || "Send a message"}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
