export function Pager({ page, total, onChange }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <button type="button" className="rounded border px-2 py-1" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span className="text-xs">
        Hal {page}/{total}
      </span>
      <button type="button" className="rounded border px-2 py-1" disabled={page >= total} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
