/** "Ask" is a placeholder, not a price. Blank it everywhere it would render. */
export function visiblePrice(price: string | undefined | null): string {
  const value = price?.trim() ?? "";
  if (!value || /^ask$/i.test(value)) return "";
  return value;
}

/** Hide prices the owner stored but chose not to show visitors. */
export function publicPrice(
  price: string | undefined | null,
  visible = true,
): string {
  if (!visible) return "";
  return visiblePrice(price);
}
