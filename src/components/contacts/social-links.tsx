import type { ReactNode } from "react";
import type { BrochureContactLink } from "@/types/brochure";
import styles from "./social-links.module.scss";

type Network =
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "whatsapp"
  | "google"
  | "link";

const FILL: Record<Network, string> = {
  instagram: "#e1306c",
  facebook: "#3b5999",
  x: "#111111",
  linkedin: "#0077b5",
  youtube: "#ff0000",
  tiktok: "#111111",
  whatsapp: "#25d366",
  google: "#dd4b39",
  link: "#6b4ea8",
};

function networkOf(link: BrochureContactLink): Network {
  const blob = `${link.label} ${link.href}`.toLowerCase();
  if (blob.includes("instagram")) return "instagram";
  if (blob.includes("facebook")) return "facebook";
  if (blob.includes("linkedin")) return "linkedin";
  if (blob.includes("youtube") || blob.includes("youtu.be")) return "youtube";
  if (blob.includes("tiktok")) return "tiktok";
  if (blob.includes("whatsapp") || blob.includes("wa.me")) return "whatsapp";
  if (blob.includes("google")) return "google";
  if (blob.includes("twitter") || blob.includes("x.com")) return "x";
  return "link";
}

function Icon({ network }: { network: Network }) {
  const common = { className: styles.icon, viewBox: "0 0 24 24", "aria-hidden": true as const };
  const paths: Record<Network, ReactNode> = {
    instagram: (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm6.25-.75a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 9.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z"
        />
      </svg>
    ),
    facebook: (
      <svg {...common}>
        <path fill="currentColor" d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7z" />
      </svg>
    ),
    x: (
      <svg {...common}>
        <path fill="currentColor" d="M4 4h3.6l4.1 5.7L16.6 4H20l-6.3 7.4L20.2 20h-3.6l-4.5-6.2L7.2 20H4l6.7-7.8z" />
      </svg>
    ),
    linkedin: (
      <svg {...common}>
        <path fill="currentColor" d="M6.5 9H3.7V21h2.8zM5.1 3.4A1.7 1.7 0 1 0 5.1 6.8 1.7 1.7 0 0 0 5.1 3.4zM20.3 21h-2.8v-6.2c0-1.8-.8-2.4-1.9-2.4s-2 .9-2 2.5V21H10.8V9h2.7v1.6c.6-1 1.8-1.9 3.6-1.9 2.4 0 4.2 1.5 4.2 4.8z" />
      </svg>
    ),
    youtube: (
      <svg {...common}>
        <path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C18.9 5 12 5 12 5s-6.9 0-8.5.5a3 3 0 0 0-2.1 2.1C1 9 1 12.2 1 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C5.1 19.4 12 19.4 12 19.4s6.9 0 8.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3z" />
      </svg>
    ),
    tiktok: (
      <svg {...common}>
        <path fill="currentColor" d="M14.5 3c.4 2.4 1.8 4 4.2 4.3v2.6a7 7 0 0 1-4.1-1.3v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a3 3 0 1 0 2.1 2.8V3z" />
      </svg>
    ),
    whatsapp: (
      <svg {...common}>
        <path fill="currentColor" d="M12 3.2A8.7 8.7 0 0 0 5.2 16.3L4 21l4.8-1.2A8.8 8.8 0 1 0 12 3.2zm4.9 12.4c-.2.6-1.2 1.1-1.7 1.2-.4.1-.9.1-1.5-.1-.3-.1-.8-.3-1.3-.5-2.3-1-3.8-3.3-3.9-3.5-.1-.2-1-1.3-1-2.5s.6-1.8.9-2 .6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.7 2 .8 2.1.1.2.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.1 2.3 1.3.3.1.4.1.6-.1l.6-.7c.2-.2.3-.2.6-.1.2.1 1.5.7 1.8.8.2.1.4.2.4.3.1.3 0 .8-.2 1.2z" />
      </svg>
    ),
    google: (
      <svg {...common}>
        <path fill="currentColor" d="M12 11v2.8h4.6c-.2 1.2-1.4 3.5-4.6 3.5A5.3 5.3 0 1 1 12 6.7a4.8 4.8 0 0 1 3.4 1.3l2.3-2.2A8 8 0 1 0 12 20c4.6 0 7.7-3.2 7.7-7.8 0-.5 0-.9-.1-1.2z" />
      </svg>
    ),
    link: (
      <svg {...common}>
        <path fill="currentColor" d="M10.6 13.4a3.2 3.2 0 0 0 4.5.2l2.4-2.4a3.2 3.2 0 0 0-4.5-4.5l-1.4 1.3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M13.4 10.6a3.2 3.2 0 0 0-4.5-.2l-2.4 2.4a3.2 3.2 0 0 0 4.5 4.5l1.3-1.3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    ),
  };
  return paths[network];
}

export function SocialLinks({
  links,
  label = "Social",
}: {
  links: BrochureContactLink[];
  label?: string;
}) {
  const items = links.filter((link) => link.href.trim());
  if (items.length === 0) return null;

  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((link) => {
        const network = networkOf(link);
        const name = link.label.trim() || network;
        return (
          <li key={`${network}-${link.href}`}>
            <a
              href={link.href}
              className={styles.link}
              style={{ ["--social-fill" as string]: FILL[network] }}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              aria-label={name}
            >
              <Icon network={network} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
