import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Edit2, Plus, Calendar, Weight } from "lucide-react";
import { api } from "../../api/client";
import { ModuleCard } from "./ModuleCard";
import { Modal } from "../Modal";
import { apiErr } from "../../utils/errors";

export function WasteLogsModule() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    logDate: "",
    amountKg: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/waste-logs");
      setLogs(res.data || []);
    } catch (err) {
      toast.error(apiErr(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleOpenAdd = () => {
    // Default to today's date formatted YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    setForm({ logDate: today, amountKg: "" });
    setEditingLog(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (log) => {
    setForm({
      logDate: log.log_date,
      amountKg: String(log.amount_kg),
    });
    setEditingLog(log);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    const amount = parseFloat(form.amountKg);
    if (isNaN(amount) || amount < 0) {
      toast.error("Jumlah sampah harus berupa angka positif");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { logDate: form.logDate, amountKg: amount };
      if (editingLog) {
        await api.put(`/admin/waste-logs/${editingLog.id}`, payload);
        toast.success("Data timbulan sampah berhasil diperbarui");
      } else {
        await api.post("/admin/waste-logs", payload);
        toast.success("Data timbulan sampah berhasil ditambahkan");
      }
      setModalOpen(false);
      fetchLogs();
    } catch (err) {
      toast.error(apiErr(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data timbulan sampah ini?")) {
      return;
    }

    try {
      await api.delete(`/admin/waste-logs/${id}`);
      toast.success("Data timbulan sampah berhasil dihapus");
      fetchLogs();
    } catch (err) {
      toast.error(apiErr(err));
    }
  };

  return (
    <ModuleCard
      title="Data Timbulan Sampah Harian"
      action={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          onClick={handleOpenAdd}
        >
          <Plus size={16} />
          Tambah Data
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left bg-slate-50 border-b">
              <th className="py-3 px-4 font-semibold text-slate-700">Tanggal</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Jumlah Sampah (Kg)</th>
              <th className="py-3 px-4 font-semibold text-slate-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-500">
                  Belum ada data timbulan sampah. Silakan tambahkan data baru.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(log.log_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">
                    {Number(log.amount_kg).toLocaleString("id-ID")} kg
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      onClick={() => handleOpenEdit(log)}
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded border border-transparent bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 size={12} />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          closeDisabled={submitting}
          title={editingLog ? "Edit Data Timbulan Sampah" : "Tambah Data Timbulan Sampah"}
        >
          <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 font-medium"
                  value={form.logDate}
                  onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                  required
                  disabled={submitting || !!editingLog}
                />
              </div>
              {editingLog && (
                <p className="mt-1 text-xs text-slate-400">Tanggal tidak dapat diubah setelah disimpan.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Jumlah Sampah (Kg)
              </label>
              <div className="relative rounded-xl border border-slate-200 focus-within:border-emerald-500 flex items-center px-3 py-2">
                <Weight size={18} className="text-slate-400 mr-2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Contoh: 150.5"
                  className="w-full text-sm focus:outline-none disabled:bg-transparent font-medium"
                  value={form.amountKg}
                  onChange={(e) => setForm({ ...form, amountKg: e.target.value })}
                  required
                  disabled={submitting}
                />
                <span className="text-sm font-semibold text-slate-400 ml-2">kg</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition"
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </ModuleCard>
  );
}
