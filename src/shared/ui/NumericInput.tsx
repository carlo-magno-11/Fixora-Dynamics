import { useEffect, useRef, useState } from "react";

export function normalizeNumericInput(rawValue: string, min = 0, step = 0.01): number {
  const parsed = Number(rawValue);
  if (!rawValue.trim() || !Number.isFinite(parsed)) return min;
  const bounded = Math.max(min, parsed);
  return step === 1 ? Math.floor(bounded) : bounded;
}

type NumericInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  "aria-label"?: string;
};

export function NumericInput({
  value,
  onValueChange,
  min = 0,
  step = 0.01,
  disabled = false,
  "aria-label": ariaLabel,
}: NumericInputProps) {
  const [rawValue, setRawValue] = useState(() => String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRawValue(String(value));
  }, [value]);

  return (
    <input
      type="number"
      min={min}
      step={step}
      value={rawValue}
      disabled={disabled}
      aria-label={ariaLabel}
      onFocus={() => { focused.current = true; }}
      onChange={(event) => {
        const nextValue = event.target.value;
        setRawValue(nextValue);
        if (nextValue.trim() !== "" && Number.isFinite(Number(nextValue))) {
          const parsed = Number(nextValue);
          if (parsed >= min) onValueChange(step === 1 ? Math.floor(parsed) : parsed);
        }
      }}
      onBlur={() => {
        focused.current = false;
        const normalized = normalizeNumericInput(rawValue, min, step);
        setRawValue(String(normalized));
        onValueChange(normalized);
      }}
    />
  );
}
