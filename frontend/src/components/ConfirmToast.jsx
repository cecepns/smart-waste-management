import toast from "react-hot-toast";
import { apiErr } from "../utils/errors";

/** Konfirmasi via react-hot-toast (custom toast), bukan window.confirm */
export function confirmToast({ message, confirmText = "Ya", cancelText = "Batal", onConfirm, destructive = true }) {
  toast.custom(
    (t) => (
      <div className="flex max-w-sm flex-col gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-800">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => toast.dismiss(t.id)}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm text-white ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await onConfirm();
              } catch (err) {
                toast.error(apiErr(err));
              }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    { duration: Infinity }
  );
}
