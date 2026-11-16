import type { ZodType } from "zod";

export type FieldKind =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "enum"
  | "image"
  | "imageList"
  | "array"
  | "object"
  | "locked";

export type FieldNode = {
  key: string;
  path: string;
  kind: FieldKind;
  schema: ZodType;
  options?: string[];
  element?: FieldNode;
  children?: FieldNode[];
};

const IMAGE_KEYS = new Set([
  "imageUrl",
  "photoUrl",
  "logoImageUrl",
  "backgroundImageUrl",
  "heroImageUrl",
  "faviconUrl",
  "shareImageUrl",
  "imageSrc",
]);

const IMAGE_ARRAY_KEYS = new Set(["images", "galleryImageUrls"]);

const LONG_TEXT = /description|bio|quote|intro|paragraph|story|note|excerpt|colophon|subheadline|subject/i;

type ZodLike = ZodType & {
  type?: string;
  def?: {
    type?: string;
    innerType?: ZodType;
    element?: ZodType;
    shape?: Record<string, ZodType>;
    discriminator?: string;
    values?: unknown[];
  };
  shape?: Record<string, ZodType>;
  options?: unknown;
  element?: ZodType;
  values?: Set<unknown>;
};

function asZod(schema: ZodType): ZodLike {
  return schema as ZodLike;
}

export function unwrapSchema(schema: ZodType): ZodType {
  let current = asZod(schema);
  const wrapped = new Set(["default", "optional", "nullable", "prefault", "catch"]);
  while (current.type && wrapped.has(current.type) && current.def?.innerType) {
    current = asZod(current.def.innerType);
  }
  return current;
}

function schemaType(schema: ZodType): string {
  return asZod(unwrapSchema(schema)).type ?? "";
}

function objectShape(schema: ZodType): Record<string, ZodType> | null {
  const inner = asZod(unwrapSchema(schema));
  if (inner.shape && typeof inner.shape === "object") {
    return inner.shape;
  }
  if (inner.def?.shape && typeof inner.def.shape === "object") {
    return inner.def.shape;
  }
  return null;
}

function unionOptions(schema: ZodType): ZodType[] {
  const inner = asZod(unwrapSchema(schema));
  const options = inner.options;
  return Array.isArray(options) ? (options as ZodType[]) : [];
}

function enumOptions(schema: ZodType): string[] {
  const inner = asZod(unwrapSchema(schema));
  if (Array.isArray(inner.options)) {
    return inner.options.map((item) => String(item));
  }
  if (inner.values instanceof Set) {
    return [...inner.values].map((item) => String(item));
  }
  if (Array.isArray(inner.def?.values)) {
    return inner.def.values.map((item) => String(item));
  }
  return [];
}

function arrayElement(schema: ZodType): ZodType | null {
  const inner = asZod(unwrapSchema(schema));
  return inner.element ?? inner.def?.element ?? null;
}

function discriminatorOf(schema: ZodType): string {
  const inner = asZod(unwrapSchema(schema));
  return inner.def?.discriminator ?? "variant";
}

function pickUnionOption(schema: ZodType, value: unknown): ZodType {
  const options = unionOptions(schema);
  if (options.length === 0) {
    return unwrapSchema(schema);
  }
  const disc = discriminatorOf(schema);
  const selected =
    value && typeof value === "object" && !Array.isArray(value)
      ? String((value as Record<string, unknown>)[disc] ?? "")
      : "";
  const match = options.find((option) => {
    const shape = objectShape(option);
    const field = shape?.[disc];
    if (!field) {
      return false;
    }
    const choices = enumOptions(field);
    return choices.includes(selected);
  });
  return match ?? options[0];
}

function isImageKey(key: string): boolean {
  return IMAGE_KEYS.has(key) || /ImageUrl$/.test(key) || key === "imageSrc";
}

function isLongString(key: string): boolean {
  return LONG_TEXT.test(key);
}

function skipKey(key: string, locked: Set<string>): boolean {
  if (locked.has(key)) {
    return true;
  }
  return false;
}

export function fieldsForSchema(
  schema: ZodType,
  value: unknown,
  options?: { locked?: string[]; prefix?: string },
): FieldNode[] {
  const locked = new Set(options?.locked ?? ["variant"]);
  const resolved = pickUnionOption(schema, value);
  const shape = objectShape(resolved);
  if (!shape) {
    return [];
  }
  const prefix = options?.prefix ?? "";
  const nodes: FieldNode[] = [];
  for (const [key, fieldSchema] of Object.entries(shape)) {
    if (skipKey(key, locked) && key !== "variant") {
      continue;
    }
    const path = prefix ? `${prefix}.${key}` : key;
    const kindLocked = locked.has(key);
    nodes.push(
      fieldNode(key, path, fieldSchema, readPath(value, key), kindLocked),
    );
  }
  return nodes;
}

function fieldNode(
  key: string,
  path: string,
  schema: ZodType,
  value: unknown,
  locked: boolean,
): FieldNode {
  if (locked || key === "variant") {
    return { key, path, kind: "locked", schema, options: enumOptions(schema) };
  }
  const type = schemaType(schema);
  if (type === "boolean") {
    return { key, path, kind: "boolean", schema };
  }
  if (type === "number") {
    return { key, path, kind: "number", schema };
  }
  if (type === "enum" || type === "literal") {
    return { key, path, kind: "enum", schema, options: enumOptions(schema) };
  }
  if (type === "array") {
    const element = arrayElement(schema);
    if (!element) {
      return { key, path, kind: "array", schema };
    }
    if (IMAGE_ARRAY_KEYS.has(key) && schemaType(element) === "string") {
      return { key, path, kind: "imageList", schema, element: fieldNode("$", `${path}[]`, element, "", false) };
    }
    const elementType = schemaType(element);
    if (elementType === "string") {
      return {
        key,
        path,
        kind: "array",
        schema,
        element: {
          key: "$",
          path: `${path}[]`,
          kind: isLongString(key) ? "text" : "string",
          schema: element,
        },
      };
    }
    const children = fieldsForSchema(element, isRecord(value) ? value : {}, {
      locked: [],
      prefix: path,
    });
    return {
      key,
      path,
      kind: "array",
      schema,
      element: {
        key: "$",
        path: `${path}[]`,
        kind: "object",
        schema: element,
        children:
          children.length > 0
            ? children
            : fieldsForSchema(pickUnionOption(element, value), value, {
                locked: [],
                prefix: path,
              }),
      },
    };
  }
  if (type === "object" || type === "union") {
    return {
      key,
      path,
      kind: "object",
      schema,
      children: fieldsForSchema(schema, value, { locked: [], prefix: path }),
    };
  }
  if (isImageKey(key)) {
    return { key, path, kind: "image", schema };
  }
  return {
    key,
    path,
    kind: isLongString(key) ? "text" : "string",
    schema,
  };
}

export function emptyFromSchema(schema: ZodType): unknown {
  const parsed = schema.safeParse(undefined);
  if (parsed.success) {
    return parsed.data;
  }
  const object = schema.safeParse({});
  if (object.success) {
    return object.data;
  }
  const options = unionOptions(schema);
  if (options.length > 0) {
    return emptyFromSchema(options[0]);
  }
  const type = schemaType(schema);
  if (type === "array") {
    return [];
  }
  if (type === "boolean") {
    return false;
  }
  if (type === "number") {
    return 0;
  }
  return "";
}

export function getAtPath(root: unknown, path: string): unknown {
  if (!path) {
    return root;
  }
  return path.split(".").reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      return current[Number(key)];
    }
    if (isRecord(current)) {
      return current[key];
    }
    return undefined;
  }, root);
}

export function setAtPath(root: unknown, path: string, value: unknown): unknown {
  const keys = path.split(".");
  return setKeys(root, keys, value);
}

function setKeys(root: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) {
    return value;
  }
  const [head, ...rest] = keys;
  if (Array.isArray(root)) {
    const next = [...root];
    const index = Number(head);
    next[index] = setKeys(next[index], rest, value);
    return next;
  }
  const record = isRecord(root) ? root : {};
  return {
    ...record,
    [head]: setKeys(record[head], rest, value),
  };
}

function readPath(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function instanceFields(content: object): Record<string, unknown> {
  const fields = { ...(content as Record<string, unknown>) };
  delete fields.component;
  return fields;
}

export function instanceLabel(instanceId: string): string {
  const match = instanceId.match(/^(Brochure[A-Za-z]+)_([1-9]\d*)$/);
  if (!match) {
    return instanceId;
  }
  const names: Record<string, string> = {
    BrochureSiteNav: "Header",
    BrochureHero: "Hero",
    BrochureGallery: "Gallery",
    BrochureInventory: "Showroom",
    BrochureDivider: "Divider",
    BrochureAbout: "About",
    BrochureElfsight: "Reviews",
    BrochureBooking: "Booking",
    BrochureContact: "Contact",
    BrochureProcess: "Process",
    BrochureNewsletter: "Letters",
    BrochureMusic: "Music",
    BrochureProject: "Projects",
    BrochureShop: "Shop",
    BrochureBanner: "Banner",
    BrochureFooter: "Footer",
  };
  const name = names[match[1]] ?? match[1].replace(/^Brochure/, "");
  return match[2] === "1" ? name : `${name} ${match[2]}`;
}
