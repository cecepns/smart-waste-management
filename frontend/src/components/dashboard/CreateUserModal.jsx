import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../Modal";
import { apiErr } from "../../utils/errors";

export function CreateUserModal({ onClose, onDone }) {
  const [f, setF] = useState({ fullName: "", email: "", password: "", role: "warga" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", f);
      toast.success("User berhasil ditambahkan");
      onDone();
    } catch (err) {
      toast.error(apiErr(err));
    }
  };

  return (
    <Modal onClose={onClose} title="Tambah User">
      <form className="space-y-2" onSubmit={submit}>
        <label className="block text-sm">
          Nama Lengkap
          <input
            className="mt-1 w-full rounded border p-2"
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded border p-2"
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            required
            minLength={6}
          />
        </label>
        <label className="block text-sm">
          Role
          <select className="mt-1 w-full rounded border p-2" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="warga">Warga</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="w-full rounded bg-emerald-600 py-2 text-white" type="submit">
          Simpan
        </button>
      </form>
    </Modal>
  );
}
