"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { showroomHref } from "@/components/inventory/data";
import styles from "./page-chrome.module.scss";

type ShowroomChromeProps = {
  businessName: string;
  logoUrl?: string;
  statusBanner?: string;
  children: ReactNode;
};

function BrandMark({ name, logoUrl }: { name: string; logoUrl: string }) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return name;
  }
  return (
    <img
      src={logoUrl}
      alt=""
      className={styles.logoImage}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Slim editorial chrome for the standalone showroom routes. Cross-route links
 * (not in-page hashes) back to the home composition and the showroom index.
 */
export function ShowroomChrome({
  businessName,
  logoUrl = "",
  statusBanner = "",
  children,
}: ShowroomChromeProps) {
  const name = businessName.trim() || "The Marque";
  const logo = logoUrl.trim();

  return (
    <div className={styles.root}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link href="/" className={styles.wordmark} aria-label={name}>
            <BrandMark name={name} logoUrl={logo} />
          </Link>
          <nav className={styles.links} aria-label="Primary">
            <Link href="/" className={styles.homeLink}>
              Home
            </Link>
            <Link href={showroomHref()}>The case</Link>
            <Link href="/#BrochureContact_1" className={styles.inquire}>
              Ask for a number
            </Link>
          </nav>
        </div>
        {statusBanner.trim() ? (
          <p className={styles.statusBanner} role="status">
            {statusBanner}
          </p>
        ) : null}
      </header>

      <main id="top" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.colophon}>{name}</p>
          <Link href="/" className={styles.footerBack}>
            Return home
          </Link>
        </div>
      </footer>
    </div>
  );
}
