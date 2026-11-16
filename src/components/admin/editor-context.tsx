"use client";

import { createContext, useContext } from "react";

export type AdminEditorValue = {
  editMode: boolean;
  openEditor: (instanceId: string) => void;
};

const AdminEditorContext = createContext<AdminEditorValue | null>(null);

export const AdminEditorProvider = AdminEditorContext.Provider;

export function useAdminEditor() {
  return useContext(AdminEditorContext);
}
