import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { useDebounce } from "../../hooks/useDebounce";
import { confirmToast } from "../ConfirmToast";
import { LocationModal } from "./LocationModal";
import { ModuleCard } from "./ModuleCard";
import { Pager } from "./Pager";
import { SearchBar } from "./SearchBar";

export function LocationsModule() {
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [modal, setModal] = useState(null);
  const load = () =>
    api.get(`/locations?page=${page}&perPage=10&search=${q}`).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  useEffect(() => {
    load();
  }, [page, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ModuleCard
      title="Manajemen Titik Lokasi"
      action={
        <button type="button" className="rounded-md bg-emerald-600 px-3 py-2 text-white" onClick={() => setModal({})}>
          + Tambah Lokasi
        </button>
      }
    >
      <SearchBar value={search} onChange={setSearch} />
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left bg-slate-50 border-b">
            <th className="py-2 px-2">Nama</th>
            <th>Tipe</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-slate-50">
              <td className="py-2.5 px-2 font-medium text-slate-800">{r.name}</td>
              <td className="text-slate-600 text-xs font-semibold">{r.type || "Titik Sampah"}</td>
              <td>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.status === "Bersih"
                    ? "bg-emerald-100 text-emerald-800"
                    : r.status === "Laporan Masuk"
                    ? "bg-amber-100 text-amber-900"
                    : r.status === "Penuh"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {r.status}
                </span>
              </td>
              <td className="space-x-2">
                <button type="button" className="rounded border px-2 py-1" onClick={() => setModal(r)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded bg-red-600 px-2 py-1 text-white"
                  onClick={() =>
                    confirmToast({
                      message: `Hapus lokasi "${r.name}"?`,
                      confirmText: "Hapus",
                      onConfirm: async () => {
                        await api.delete(`/locations/${r.id}`);
                        toast.success("Lokasi dihapus");
                        load();
                      },
                    })
                  }
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager page={page} total={meta.totalPages} onChange={setPage} />
      {modal !== null && (
        <LocationModal initial={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
    </ModuleCard>
  );
}
