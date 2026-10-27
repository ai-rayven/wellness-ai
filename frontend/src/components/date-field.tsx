import type { IsoDate } from '@/lib/types';

interface DateFieldProps {
  label: string;
  value: IsoDate | '';
  max: IsoDate;
  onChange: (value: IsoDate | '') => void;
}

/**
 * The browser's date input, which gives the native date picker on phones.
 * Web only: the iOS and Android apps will need a picker component here.
 */
export function DateField({ label, value, max, onChange }: DateFieldProps) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      max={max}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 w-full rounded-xl border-0 bg-card-2 px-3 font-[inherit] text-base text-text"
    />
  );
}
