"use client";

import { useState, type ReactNode } from "react";
import type { BrochureInstanceContent } from "@/types/brochure";
import { changeSitePassword, loginSite, logoutSite } from "@/lib/admin/api";
import { instanceLabel } from "@/lib/admin/schema-fields";
import { useBrochureStore } from "@/lib/admin/store";
import { AdminEditorProvider } from "./editor-context";
import { EditChip } from "./edit-chip";
import { EditorSheet } from "./editor-sheet";
import { LoginModal } from "./login-modal";
import { PasswordModal } from "./password-modal";
import styles from "./admin.module.scss";

export function AdminChrome({ children }: { children: ReactNode }) {
  const store = useBrochureStore();
  const [loginOpen, setLoginOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BrochureInstanceContent | null>(null);
  const [draft, setDraft] = useState<BrochureInstanceContent | null>(null);

  if (!store?.site) {
    return children;
  }

  const musicId = store.blueprint.BrochureMusic_1 ? "BrochureMusic_1" : null;

  function openEditor(instanceId: string) {
    const slice = store?.blueprint[instanceId];
    if (!slice) {
      return;
    }
    setEditingId(instanceId);
    setSnapshot(slice);
    setDraft(slice);
  }

  function closeEditor() {
    if (editingId && snapshot) {
      store?.restoreInstance(editingId, snapshot);
    }
    setEditingId(null);
    setSnapshot(null);
    setDraft(null);
  }

  return (
    <AdminEditorProvider value={{ editMode: store.editMode, openEditor }}>
      {children}
      {store.loginEnabled && !store.signedIn ? (
        <div className={styles.signIn}>
          <button type="button" className={styles.chip} onClick={() => setLoginOpen(true)}>
            Sign in
          </button>
        </div>
      ) : null}
      {store.signedIn ? (
        <div className={styles.bar}>
          <button
            type="button"
            className={styles.barButton}
            data-active={store.editMode ? "true" : undefined}
            onClick={() => store.setEditMode(!store.editMode)}
          >
            {store.editMode ? "Done" : "Edit"}
          </button>
          {store.editMode && musicId ? (
            <button
              type="button"
              className={styles.barButton}
              onClick={() => openEditor(musicId)}
            >
              {instanceLabel(musicId)}
            </button>
          ) : null}
          <span className={styles.grow} />
          <button
            type="button"
            className={styles.barButton}
            onClick={() => setPasswordOpen(true)}
          >
            Password
          </button>
          <button
            type="button"
            className={styles.barButton}
            onClick={async () => {
              if (store.token) {
                try {
                  await logoutSite(store.site!, store.token);
                } catch {
                  // still drop the local session
                }
              }
              store.setToken(null);
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
      {store.editMode ? (
        <div className={styles.headerEdit}>
          <EditChip instanceId="BrochureSiteNav_1" />
        </div>
      ) : null}
      {loginOpen ? (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSubmit={async (username, password) => {
            const result = await loginSite(store.site!, username, password);
            store.setToken(result.token);
            store.setEditMode(true);
            setLoginOpen(false);
          }}
        />
      ) : null}
      {passwordOpen ? (
        <PasswordModal
          onClose={() => setPasswordOpen(false)}
          onSubmit={async (currentPassword, newPassword) => {
            await changeSitePassword(
              store.site!,
              store.token!,
              currentPassword,
              newPassword,
            );
            setPasswordOpen(false);
          }}
        />
      ) : null}
      {editingId && snapshot && draft ? (
        <EditorSheet
          instanceId={editingId}
          snapshot={snapshot}
          draft={draft}
          onDraft={(next) => {
            setDraft(next);
            store.previewInstance(editingId, next);
          }}
          onSave={async (content) => {
            await store.persistInstance(editingId, content);
            setSnapshot(content);
            setDraft(content);
            setEditingId(null);
          }}
          onCancel={closeEditor}
        />
      ) : null}
    </AdminEditorProvider>
  );
}
