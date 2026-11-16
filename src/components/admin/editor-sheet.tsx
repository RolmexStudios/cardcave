"use client";

import { useMemo, useState } from "react";
import type { BrochureInstanceContent } from "@/types/brochure";
import { brochureComponentRegistry } from "@/lib/brochure/registry";
import { parseInstanceKey } from "@/lib/brochure/scan-template";
import { fieldsForSchema, instanceFields, instanceLabel } from "@/lib/admin/schema-fields";
import { FieldList } from "./field-editor";
import styles from "./admin.module.scss";

export function EditorSheet({
  instanceId,
  snapshot,
  draft,
  onDraft,
  onSave,
  onCancel,
}: {
  instanceId: string;
  snapshot: BrochureInstanceContent;
  draft: BrochureInstanceContent;
  onDraft: (next: BrochureInstanceContent) => void;
  onSave: (content: BrochureInstanceContent) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const parsed = parseInstanceKey(instanceId);
  const component = parsed?.component ?? snapshot.component;
  const def = brochureComponentRegistry[component];
  const skipLinks = component === "BrochureSiteNav" || component === "BrochureFooter";
  const fields = useMemo(() => {
    return fieldsForSchema(def.schema, instanceFields(draft), {
      locked: skipLinks ? ["variant", "links"] : ["variant"],
    }).filter((field) => !(skipLinks && field.key === "links"));
  }, [def.schema, draft, skipLinks]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const parsedFields = def.schema.parse(instanceFields(draft)) as Record<string, unknown>;
      const content = { component, ...parsedFields } as BrochureInstanceContent;
      onDraft(content);
      await onSave(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  function requestClose() {
    if (JSON.stringify(draft) !== JSON.stringify(snapshot)) {
      if (!window.confirm("Discard unsaved changes?")) {
        return;
      }
    }
    onCancel();
  }

  return (
    <div className={styles.sheetScrim} onClick={requestClose}>
      <aside className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <div className={styles.sheetHead}>
          <div>
            <h2 className={styles.title}>Edit {instanceLabel(instanceId)}</h2>
            <p className={styles.hint}>Changes preview on the page. Save to publish.</p>
          </div>
          <button type="button" className={styles.ghost} onClick={requestClose}>
            Close
          </button>
        </div>
        <div className={styles.sheetBody}>
          <FieldList
            fields={fields}
            value={instanceFields(draft)}
            onChange={(next) => {
              const record = next && typeof next === "object" ? next : {};
              onDraft({
                component,
                ...(record as Record<string, unknown>),
              } as BrochureInstanceContent);
            }}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
        <div className={styles.sheetFoot}>
          <button type="button" className={styles.ghost} onClick={requestClose}>
            Cancel
          </button>
          <button type="button" className={styles.primary} disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </aside>
    </div>
  );
}
