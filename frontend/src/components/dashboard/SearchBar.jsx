import { Search } from "lucide-react";

export function SearchBar({ value, onChange }) {
  return (
    <div className="relative max-w-sm">
      <Search size={14} className="absolute left-2 top-3 text-slate-400" />
      <input
        className="w-full rounded-md border p-2 pl-8"
        placeholder="Cari..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
