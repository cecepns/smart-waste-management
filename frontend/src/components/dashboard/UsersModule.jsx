import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2, User } from "lucide-react";
import { api } from "../../api/client";
import { CreateUserModal } from "./CreateUserModal";
import { useDebounce } from "../../hooks/useDebounce";
import { confirmToast } from "../ConfirmToast";
import { UserModal } from "./UserModal";
import { ModuleCard } from "./ModuleCard";
import { Pager } from "./Pager";
import { SearchBar } from "./SearchBar";

export const USERS_PER_PAGE = 10;

export function UsersModule() {
  const { me } = useOutletContext();
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0, perPage: USERS_PER_PAGE });
  const [modal, setModal] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  /* Saat kata kunci (debounced) berubah, kembali ke halaman 1 sebelum fetch — sinkron agar tidak request halaman salah */
  useLayoutEffect(() => {
    setPage(1);
  }, [q]);

  const refreshUsers = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(USERS_PER_PAGE),
      search: q,
    });
    return api.get(`/users?${params.toString()}`).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  }, [page, q]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  return (
    <ModuleCard
      title="Manajemen User"
      action={
        <button type="button" className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white" onClick={() => setCreateOpen(true)}>
          + Tambah User
        </button>
      }
    >
      <SearchBar value={search} onChange={setSearch} />
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left bg-slate-50 border-b">
            <th className="py-2">Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-3 font-medium text-slate-800">{r.full_name}</td>
              <td>{r.email}</td>
              <td>
                <span className="capitalize font-medium text-slate-600">{r.role}</span>
              </td>
              <td>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : r.status === "pending"
                    ? "bg-amber-100 text-amber-900"
                    : r.status === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-800"
                }`}>
                  {r.status === "approved" ? "Aktif" : r.status === "pending" ? "Menunggu" : r.status === "rejected" ? "Ditolak" : "Nonaktif"}
                </span>
              </td>
              <td className="space-x-2 py-3">
                <button type="button" className="rounded border px-2 py-1 text-slate-700 hover:bg-slate-50 text-xs font-medium" onClick={() => setModal(r)}>
                  <User size={12} className="inline mr-1" /> Edit
                </button>
                
                {r.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="rounded bg-emerald-600 px-2 py-1 text-white text-xs font-medium hover:bg-emerald-700"
                      onClick={async () => {
                        try {
                          await api.put(`/users/${r.id}`, { fullName: r.full_name, role: r.role, status: "approved" });
                          toast.success("User disetujui");
                          await refreshUsers();
                        } catch (err) {
                          toast.error(err.message || "Gagal menyetujui user");
                        }
                      }}
                    >
                      Setujui
                    </button>
                    <button
                      type="button"
                      className="rounded bg-rose-600 px-2 py-1 text-white text-xs font-medium hover:bg-rose-700"
                      onClick={async () => {
                        try {
                          await api.put(`/users/${r.id}`, { fullName: r.full_name, role: r.role, status: "rejected" });
                          toast.success("User ditolak");
                          await refreshUsers();
                        } catch (err) {
                          toast.error(err.message || "Gagal menolak user");
                        }
                      }}
                    >
                      Tolak
                    </button>
                  </>
                )}
                {r.status === "approved" && r.id !== me?.id && r.role !== "admin" && (
                  <button
                    type="button"
                    className="rounded bg-slate-600 px-2 py-1 text-white text-xs font-medium hover:bg-slate-700"
                    onClick={async () => {
                      try {
                        await api.put(`/users/${r.id}`, { fullName: r.full_name, role: r.role, status: "inactive" });
                        toast.success("User dinonaktifkan");
                        await refreshUsers();
                      } catch (err) {
                        toast.error(err.message || "Gagal menonaktifkan user");
                      }
                    }}
                  >
                    Nonaktifkan
                  </button>
                )}
                {(r.status === "inactive" || r.status === "rejected") && (
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2 py-1 text-white text-xs font-medium hover:bg-emerald-700"
                    onClick={async () => {
                      try {
                        await api.put(`/users/${r.id}`, { fullName: r.full_name, role: r.role, status: "approved" });
                        toast.success("User diaktifkan");
                        await refreshUsers();
                      } catch (err) {
                        toast.error(err.message || "Gagal mengaktifkan user");
                      }
                    }}
                  >
                    Aktifkan
                  </button>
                )}

                {r.id !== me?.id && (
                  <button
                    type="button"
                    className="rounded bg-red-600 px-2 py-1 text-white text-xs font-medium hover:bg-red-700"
                    onClick={() =>
                      confirmToast({
                        message: `Hapus user "${r.full_name}"? Laporan yang ditulis user ini ikut terhapus.`,
                        confirmText: "Hapus",
                        onConfirm: async () => {
                          await api.delete(`/users/${r.id}`);
                          toast.success("User dihapus");
                          await refreshUsers();
                        },
                      })
                    }
                  >
                    <Trash2 size={12} className="inline mr-1" /> Hapus
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Maksimal {meta.perPage ?? USERS_PER_PAGE} user per halaman (API). Total data: {meta.total ?? 0}.
      </p>
      <Pager page={page} total={meta.totalPages} onChange={setPage} />

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onDone={() => {
            setCreateOpen(false);
            refreshUsers();
          }}
        />
      )}
      {modal && (
        <UserModal
          initial={modal}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            refreshUsers();
          }}
        />
      )}
    </ModuleCard>
  );
}
