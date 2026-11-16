"use client";

import styles from "./admin.module.scss";
import { useAdminEditor } from "./editor-context";

export function EditChip({
  instanceId,
  className,
}: {
  instanceId: string;
  className?: string;
}) {
  const editor = useAdminEditor();
  if (!editor?.editMode || !instanceId) {
    return null;
  }
  return (
    <button
      type="button"
      className={`${styles.chip} ${className ?? ""}`.trim()}
      onClick={() => editor.openEditor(instanceId)}
    >
      Edit
    </button>
  );
}
