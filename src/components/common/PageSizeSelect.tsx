interface Props {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function PageSizeSelect({ value, onChange, label = 'Số dòng' }: Props) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
      >
        {[6, 12, 20, 50].map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </label>
  );
}
