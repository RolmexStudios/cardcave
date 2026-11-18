import styles from "./chip-row.module.scss";

type ChipRowProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allLabel?: string;
  chipClassName: string;
  chipOnClassName: string;
  labelClassName: string;
  rowClassName: string;
};

const ALL = "all";

export function ChipRow({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
  chipClassName,
  chipOnClassName,
  labelClassName,
  rowClassName,
}: ChipRowProps) {
  if (options.length === 0) return null;

  return (
    <div className={rowClassName} role="group" aria-label={label}>
      <p className={labelClassName}>{label}</p>
      <div className={styles.chips}>
        <button
          type="button"
          className={value === ALL ? chipOnClassName : chipClassName}
          aria-pressed={value === ALL}
          onClick={() => onChange(ALL)}
        >
          {allLabel}
        </button>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? chipOnClassName : chipClassName}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
