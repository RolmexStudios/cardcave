"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBrochureStore } from "@/lib/admin/store";
import styles from "./admin.module.scss";

type AdminAuthUi = {
  openLogin: () => void;
};

const AdminAuthUiContext = createContext<AdminAuthUi | null>(null);

export function AdminAuthUiProvider({
  openLogin,
  children,
}: {
  openLogin: () => void;
  children: ReactNode;
}) {
  return (
    <AdminAuthUiContext.Provider value={{ openLogin }}>
      {children}
    </AdminAuthUiContext.Provider>
  );
}

export function AdminSignInButton({ className }: { className?: string }) {
  const store = useBrochureStore();
  const ui = useContext(AdminAuthUiContext);
  if (!store?.loginEnabled || store.signedIn || !ui) {
    return null;
  }
  return (
    <button
      type="button"
      className={className ? `${styles.headerSignIn} ${className}` : styles.headerSignIn}
      onClick={ui.openLogin}
    >
      Sign in
    </button>
  );
}
