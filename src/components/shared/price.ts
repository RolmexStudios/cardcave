/** "Ask" is a placeholder, not a price. Blank it everywhere it would render. */
export function visiblePrice(price: string | undefined | null): string {
  const value = price?.trim() ?? "";
  if (!value || /^ask$/i.test(value)) return "";
  return value;
}
