import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../Modal";
import { apiErr } from "../../utils/errors";

export function CreateUserModal({ onClose, onDone }) {
  const [f, setF] = useState({ fullName: "", email: "", password: "", role: "warga" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post("/users", f);
      toast.success("User berhasil ditambahkan");
      onDone();
    } catch (err) {
      toast.error(apiErr(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} closeDisabled={submitting} title="Tambah User">
      <form className="space-y-2" onSubmit={submit}>
        <label className="block text-sm">
          Nama Lengkap
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
            required
            disabled={submitting}
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            required
            disabled={submitting}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            type="password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            required
            minLength={6}
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
            <option value="pengawas">Pengawas Lingkungan</option>
            <option value="armada">Petugas Armada</option>
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
