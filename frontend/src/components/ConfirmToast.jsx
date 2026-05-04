import { useState } from "react";
import toast from "react-hot-toast";
import { apiErr } from "../utils/errors";

function ConfirmToastBody({ t, message, confirmText = "Ya", cancelText = "Batal", onConfirm, destructive = true }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-800">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={loading}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => !loading && toast.dismiss(t.id)}
        >
          {cancelText}
        </button>
        <button
          type="button"
          disabled={loading}
          className={`rounded-md px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          onClick={async () => {
            if (loading) return;
            setLoading(true);
            try {
              await onConfirm();
              toast.dismiss(t.id);
            } catch (err) {
              toast.error(apiErr(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Memuat..." : confirmText}
        </button>
      </div>
    </div>
  );
}

/** Konfirmasi via react-hot-toast (custom toast), bukan window.confirm */
export function confirmToast(opts) {
  toast.custom((t) => <ConfirmToastBody t={t} {...opts} />, { duration: Infinity });
}
