import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../Modal";
import { apiErr } from "../../utils/errors";

export function UserModal({ initial, onClose, onDone }) {
  const [f, setF] = useState({ fullName: initial.full_name, role: initial.role });
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal onClose={onClose} closeDisabled={submitting} title="Edit User">
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          try {
            await api.put(`/users/${initial.id}`, f);
            toast.success("Data user diperbarui");
            onDone();
          } catch (err) {
            toast.error(apiErr(err));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <label className="block text-sm">
          Nama Lengkap
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
            disabled={submitting}
          />
        </label>
        <label className="block text-sm">
          Role
          <select
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.role}
            onChange={(e) => setF({ ...f, role: e.target.value })}
            disabled={submitting}
          >
            <option value="warga">Warga</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          className="w-full rounded bg-emerald-600 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Memuat..." : "Simpan"}
        </button>
      </form>
    </Modal>
  );
}
