import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { useDebounce } from "../../hooks/useDebounce";
import { confirmToast } from "../ConfirmToast";
import { apiErr } from "../../utils/errors";
import { ModuleCard } from "./ModuleCard";
import { Pager } from "./Pager";
import { SearchBar } from "./SearchBar";

function ReportStatusBadge({ status }) {
  const s = status || "pending";
  if (s === "approved") {
    return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Disetujui</span>;
  }
  if (s === "rejected") {
    return <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Ditolak</span>;
  }
  return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">Menunggu</span>;
}

export function ReportsModule() {
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const load = () =>
    api.get(`/reports?page=${page}&perPage=10&search=${encodeURIComponent(q)}`).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  useEffect(() => {
    load();
  }, [page, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ModuleCard title="Daftar Laporan Masuk">
      <SearchBar value={search} onChange={setSearch} />
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Lokasi</th>
            <th>Kondisi</th>
            <th>Status laporan</th>
            <th>Pelapor</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const reportStatus = r.report_status || "pending";
            const isPending = reportStatus === "pending";

            return (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.location_name}</td>
                <td>{r.status}</td>
                <td>
                  <ReportStatusBadge status={reportStatus} />
                </td>
                <td>{r.reporter_name}</td>
                <td className="space-x-2">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="rounded bg-emerald-600 px-2 py-1 text-white"
                        onClick={async () => {
                          try {
                            await api.patch(`/reports/${r.id}/approve`);
                            toast.success("Laporan disetujui");
                            load();
                          } catch (err) {
                            toast.error(apiErr(err));
                          }
                        }}
                      >
                        <CheckCircle2 size={14} className="inline" /> Setujui
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-600 px-2 py-1 text-white"
                        onClick={() =>
                          confirmToast({
                            message: "Tolak laporan ini?",
                            confirmText: "Tolak",
                            onConfirm: async () => {
                              await api.delete(`/reports/${r.id}/reject`);
                              toast.success("Laporan ditolak");
                              load();
                            },
                          })
                        }
                      >
                        <Trash2 size={14} className="inline" /> Tolak
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 hover:bg-slate-50"
                      onClick={() =>
                        confirmToast({
                          message: "Hapus laporan dari daftar?",
                          confirmText: "Hapus",
                          onConfirm: async () => {
                            await api.delete(`/reports/${r.id}`);
                            toast.success("Laporan dihapus");
                            load();
                          },
                        })
                      }
                    >
                      <Trash2 size={14} className="inline" /> Hapus
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pager page={page} total={meta.totalPages} onChange={setPage} />
    </ModuleCard>
  );
}
