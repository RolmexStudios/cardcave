"use client";

import {
  emptyFromSchema,
  fieldsForSchema,
  getAtPath,
  setAtPath,
  type FieldNode,
} from "@/lib/admin/schema-fields";
import { ImageField } from "./image-field";
import styles from "./admin.module.scss";

function pretty(key: string) {
  return key
    .replace(/Url$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function FieldList({
  fields,
  value,
  onChange,
}: {
  fields: FieldNode[];
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  return (
    <>
      {fields.map((field) => (
        <FieldControl
          key={field.path}
          field={field}
          value={value}
          onChange={onChange}
        />
      ))}
    </>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldNode;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const current = getAtPath(value, field.path);

  const patch = (nextValue: unknown) => {
    onChange(setAtPath(value, field.path, nextValue));
  };

  if (field.kind === "locked") {
    return (
      <div className={styles.field}>
        <span>{pretty(field.key)}</span>
        <div className={styles.locked}>{String(current ?? "")}</div>
      </div>
    );
  }

  if (field.kind === "boolean") {
    return (
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={Boolean(current)}
          onChange={(event) => patch(event.target.checked)}
        />
        <span>{pretty(field.key)}</span>
      </label>
    );
  }

  if (field.kind === "number") {
    return (
      <label className={styles.field}>
        <span>{pretty(field.key)}</span>
        <input
          type="number"
          value={typeof current === "number" ? current : Number(current ?? 0)}
          onChange={(event) => patch(event.target.valueAsNumber)}
        />
      </label>
    );
  }

  if (field.kind === "enum") {
    return (
      <label className={styles.field}>
        <span>{pretty(field.key)}</span>
        <select
          value={String(current ?? "")}
          onChange={(event) => patch(event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.kind === "image") {
    return (
      <ImageField
        label={pretty(field.key)}
        value={String(current ?? "")}
        onChange={patch}
      />
    );
  }

  if (field.kind === "imageList") {
    const items = Array.isArray(current) ? current.map(String) : [];
    return (
      <fieldset className={styles.field}>
        <legend className={styles.legend}>{pretty(field.key)}</legend>
        <div className={styles.list}>
          {items.map((item, index) => (
            <div key={`${field.path}-${index}`} className={styles.item}>
              <ImageField
                label={`Photo ${index + 1}`}
                value={item}
                onChange={(url) => {
                  const next = [...items];
                  next[index] = url;
                  patch(next);
                }}
              />
              <ArrayButtons
                index={index}
                total={items.length}
                onMove={(from, to) => patch(moveItem(items, from, to))}
                onRemove={() => patch(items.filter((_, i) => i !== index))}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => patch([...items, ""])}
        >
          Add photo
        </button>
      </fieldset>
    );
  }

  if (field.kind === "array") {
    const items = Array.isArray(current) ? current : [];
    const element = field.element;
    return (
      <fieldset className={styles.field}>
        <legend className={styles.legend}>{pretty(field.key)}</legend>
        <div className={styles.list}>
          {items.map((item, index) => (
            <div key={`${field.path}-${index}`} className={styles.item}>
              {element?.kind === "object" || element?.kind === "array" ? (
                <FieldList
                  fields={fieldsForSchema(element.schema, item, {
                    locked: [],
                    prefix: "",
                  })}
                  value={item}
                  onChange={(nextItem) => {
                    const next = [...items];
                    next[index] = nextItem;
                    patch(next);
                  }}
                />
              ) : (
                <StringInput
                  label={`${pretty(field.key)} ${index + 1}`}
                  value={String(item ?? "")}
                  multiline={element?.kind === "text"}
                  onChange={(text) => {
                    const next = [...items];
                    next[index] = text;
                    patch(next);
                  }}
                />
              )}
              <ArrayButtons
                index={index}
                total={items.length}
                onMove={(from, to) => patch(moveItem(items, from, to))}
                onRemove={() => patch(items.filter((_, i) => i !== index))}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.ghost}
          onClick={() =>
            patch([
              ...items,
              element ? emptyFromSchema(element.schema) : "",
            ])
          }
        >
          Add
        </button>
      </fieldset>
    );
  }

  if (field.kind === "object") {
    const record = current && typeof current === "object" ? current : {};
    return (
      <fieldset className={styles.field}>
        <legend className={styles.legend}>{pretty(field.key)}</legend>
        <FieldList
          fields={
            field.children ??
            fieldsForSchema(field.schema, record, { locked: [], prefix: "" })
          }
          value={record}
          onChange={patch}
        />
      </fieldset>
    );
  }

  return (
    <StringInput
      label={pretty(field.key)}
      value={String(current ?? "")}
      multiline={field.kind === "text"}
      onChange={patch}
    />
  );
}

function StringInput({
  label,
  value,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  multiline: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ArrayButtons({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.itemBar}>
      <button
        type="button"
        className={styles.itemButton}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        Up
      </button>
      <button
        type="button"
        className={styles.itemButton}
        disabled={index >= total - 1}
        onClick={() => onMove(index, index + 1)}
      >
        Down
      </button>
      <button type="button" className={styles.ghost} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
