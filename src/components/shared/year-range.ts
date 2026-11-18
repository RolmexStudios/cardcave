export type YearRangeValue = {
  year: string;
  yearEnd?: string;
};

export type ParsedYearRange = {
  start: number;
  end: number;
};

const RANGE_SPLIT = /^(\d{4})\s*[-–—/]\s*(\d{2,4})$/;

function parseYearToken(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d{4}$/.test(value)) {
    return null;
  }
  const year = Number(value);
  return Number.isFinite(year) ? year : null;
}

function expandEndYear(start: number, rawEnd: string): number {
  if (/^\d{4}$/.test(rawEnd)) {
    return Number(rawEnd);
  }
  const two = Number(rawEnd);
  let end = Math.floor(start / 100) * 100 + two;
  if (end < start) {
    end += 100;
  }
  return end;
}

/** Read a single year or a written range such as "1993-94" / "2012–2013". */
export function parseYearRange(
  year: string,
  yearEnd = "",
): ParsedYearRange | null {
  const startRaw = year.trim();
  const endRaw = yearEnd.trim();
  const written = startRaw.match(RANGE_SPLIT);

  if (written && !endRaw) {
    const start = Number(written[1]);
    const end = expandEndYear(start, written[2]);
    return normalizeRange(start, end);
  }

  const start = parseYearToken(startRaw) ?? parseYearToken(endRaw);
  if (start == null) {
    return null;
  }
  const end = parseYearToken(endRaw) ?? start;
  return normalizeRange(start, end);
}

function normalizeRange(start: number, end: number): ParsedYearRange {
  return start <= end ? { start, end } : { start: end, end: start };
}

/** Public label: "1993" or "1993 – 1994". */
export function formatYearRange(year: string, yearEnd = ""): string {
  const parsed = parseYearRange(year, yearEnd);
  if (!parsed) {
    return year.trim() || yearEnd.trim();
  }
  if (parsed.start === parsed.end) {
    return String(parsed.start);
  }
  return `${parsed.start} – ${parsed.end}`;
}

export function yearsInRange(range: ParsedYearRange): string[] {
  const span = range.end - range.start;
  if (span > 20) {
    return [String(range.start), String(range.end)];
  }
  const years: string[] = [];
  for (let year = range.start; year <= range.end; year += 1) {
    years.push(String(year));
  }
  return years;
}

/** Unique calendar years covered by records, newest first. */
export function collectFilterYears(entries: YearRangeValue[]): string[] {
  const seen = new Set<string>();
  for (const entry of entries) {
    const parsed = parseYearRange(entry.year, entry.yearEnd);
    if (!parsed) {
      continue;
    }
    for (const year of yearsInRange(parsed)) {
      seen.add(year);
    }
  }
  return [...seen].sort((a, b) => Number(b) - Number(a));
}

export function matchesYearFilter(
  entry: YearRangeValue,
  filter: string,
  allValue = "all",
): boolean {
  const needle = filter.trim();
  if (!needle || needle === allValue) {
    return true;
  }
  const range = parseYearRange(entry.year, entry.yearEnd);
  const want = parseYearToken(needle);
  if (range && want != null) {
    return want >= range.start && want <= range.end;
  }
  const label = formatYearRange(entry.year, entry.yearEnd);
  return label === needle || entry.year.trim() === needle;
}

export function yearRangesOverlap(
  left: YearRangeValue,
  right: YearRangeValue,
): boolean {
  const a = parseYearRange(left.year, left.yearEnd);
  const b = parseYearRange(right.year, right.yearEnd);
  if (a && b) {
    return a.start <= b.end && b.start <= a.end;
  }
  return (
    Boolean(left.year.trim()) &&
    left.year.trim() === right.year.trim()
  );
}
