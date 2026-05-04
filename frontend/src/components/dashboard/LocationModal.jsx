import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../Modal";
import { apiErr } from "../../utils/errors";

export function LocationModal({ initial, onClose, onDone }) {
  const [f, setF] = useState({
    name: initial.name || "",
    latitude: initial.latitude || "",
    longitude: initial.longitude || "",
    status: initial.status || "Bersih",
    notes: initial.notes || "",
    photo_url: initial.photo_url || "",
  });
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (initial.id) await api.put(`/locations/${initial.id}`, f);
      else await api.post("/locations", f);
      toast.success(initial.id ? "Lokasi diperbarui" : "Lokasi ditambahkan");
      onDone();
    } catch (err) {
      toast.error(apiErr(err));
    }
  };
  return (
    <Modal onClose={onClose} title={initial.id ? "Edit Lokasi" : "Tambah Lokasi"}>
      <form className="space-y-2" onSubmit={submit}>
        <label className="block text-sm">
          Nama Lokasi
          <input className="mt-1 w-full rounded border p-2" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </label>
        <label className="block text-sm">
          Latitude
          <input className="mt-1 w-full rounded border p-2" value={f.latitude} onChange={(e) => setF({ ...f, latitude: e.target.value })} required />
        </label>
        <label className="block text-sm">
          Longitude
          <input className="mt-1 w-full rounded border p-2" value={f.longitude} onChange={(e) => setF({ ...f, longitude: e.target.value })} required />
        </label>
        <label className="block text-sm">
          Status
          <select className="mt-1 w-full rounded border p-2" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option>Bersih</option>
            <option>Sedang</option>
            <option>Penuh</option>
          </select>
        </label>
        <label className="block text-sm">
          Catatan
          <input className="mt-1 w-full rounded border p-2" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </label>
        <button className="w-full rounded bg-emerald-600 py-2 text-white" type="submit">
          Simpan
        </button>
      </form>
    </Modal>
  );
}
