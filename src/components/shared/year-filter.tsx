"use client";

import { useMemo } from "react";
import {
  FilterSelect,
  type FilterSelectProps,
} from "@/components/shared/filter-select";
import {
  collectFilterYears,
  type YearRangeValue,
} from "@/components/shared/year-range";

export type YearFilterProps = {
  id?: string;
  label?: string;
  value: string;
  entries: YearRangeValue[];
  onChange: (value: string) => void;
  allLabel?: string;
  variant?: FilterSelectProps["variant"];
};

/**
 * Year dropdown that understands season ranges (1993 – 1994).
 * Options are every calendar year covered by the records.
 */
export function YearFilter({
  id,
  label = "Year",
  value,
  entries,
  onChange,
  allLabel = "All years",
  variant = "dropdown",
}: YearFilterProps) {
  const options = useMemo(() => collectFilterYears(entries), [entries]);
  if (options.length === 0) {
    return null;
  }
  return (
    <FilterSelect
      id={id}
      label={label}
      value={value}
      options={options}
      allLabel={allLabel}
      variant={variant}
      onChange={onChange}
    />
  );
}
