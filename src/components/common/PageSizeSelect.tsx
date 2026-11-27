import { useEffect, useState } from 'react';
import { MAX_PAGE_SIZE } from '../../hooks/usePageSize';

interface Props {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function PageSizeSelect({ value, onChange, label = 'Số dòng' }: Props) {
  const presets = [6, 12, 20, 50];
  const [customMode, setCustomMode] = useState(!presets.includes(value));
  const [customSize, setCustomSize] = useState(String(value));

  useEffect(() => {
    setCustomSize(String(value));
    setCustomMode(!presets.includes(value));
  }, [value]);

  return (
    <div className="inline-flex items-center gap-2 text-sm text-gray-600">
      <label htmlFor="page-size-preset">{label}</label>
      <select
        id="page-size-preset"
        aria-label={label}
        value={customMode ? 'custom' : value}
        onChange={(event) => {
          if (event.target.value === 'custom') {
            setCustomMode(true);
          } else {
            setCustomMode(false);
            onChange(Number(event.target.value));
          }
        }}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
      >
        {presets.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
        <option value="custom">Tùy chỉnh</option>
      </select>
      {customMode && (
        <input
          aria-label="Số dòng tùy chỉnh"
          type="number"
          min={1}
          max={MAX_PAGE_SIZE}
          step={1}
          value={customSize}
          onChange={(event) => {
            const input = event.target.value;
            setCustomSize(input);
            const size = Number(input);
            if (Number.isSafeInteger(size) && size > 0 && size <= MAX_PAGE_SIZE) onChange(size);
          }}
          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
        />
      )}
    </div>
  );
}
