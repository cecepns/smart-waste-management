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
    type: initial.type || "Titik Sampah",
    notes: initial.notes || "",
    photo_url: initial.photo_url || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (initial.id) await api.put(`/locations/${initial.id}`, f);
      else await api.post("/locations", f);
      toast.success(initial.id ? "Lokasi diperbarui" : "Lokasi ditambahkan");
      onDone();
    } catch (err) {
      toast.error(apiErr(err));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Modal onClose={onClose} closeDisabled={submitting} title={initial.id ? "Edit Lokasi" : "Tambah Lokasi"}>
      <form className="space-y-2" onSubmit={submit}>
        <label className="block text-sm">
          Nama Lokasi
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            required
            disabled={submitting}
          />
        </label>
        <label className="block text-sm">
          Tipe Lokasi
          <select
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100 bg-white font-medium"
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value })}
            disabled={submitting}
          >
            <option value="Titik Sampah">Titik Sampah (Laporan Warga)</option>
            <option value="TPS">TPS (Tempat Pembuangan Sementara)</option>
            <option value="TPA">TPA (Tempat Pembuangan Akhir)</option>
            <option value="TPS3R">TPS3R (TPS Reuse, Reduce, Recycle)</option>
          </select>
        </label>
        <label className="block text-sm">
          Latitude
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.latitude}
            onChange={(e) => setF({ ...f, latitude: e.target.value })}
            required
            disabled={submitting}
          />
        </label>
        <label className="block text-sm">
          Longitude
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.longitude}
            onChange={(e) => setF({ ...f, longitude: e.target.value })}
            required
            disabled={submitting}
          />
        </label>
        <label className="block text-sm">
          Status
          <select
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100 bg-white"
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value })}
            disabled={submitting}
          >
            <option>Bersih</option>
            <option>Laporan Masuk</option>
            <option>Penuh</option>
            <option>Sedang Ditangani</option>
          </select>
        </label>
        <label className="block text-sm">
          Catatan
          <input
            className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
            disabled={submitting}
          />
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
