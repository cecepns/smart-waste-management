import { useCallback, useEffect, useLayoutEffect, useState } from "react";
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

/** Selaras dengan backend MAX_PER_PAGE (10) */
export const USERS_PER_PAGE = 10;

export function UsersModule() {
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
          <tr className="text-left">
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.full_name}</td>
              <td>{r.email}</td>
              <td>{r.role}</td>
              <td className="space-x-2">
                <button type="button" className="rounded border px-2 py-1" onClick={() => setModal(r)}>
                  <User size={14} className="inline" /> Edit
                </button>
                <button
                  type="button"
                  className="rounded bg-red-600 px-2 py-1 text-white"
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
                  <Trash2 size={14} className="inline" /> Hapus
                </button>
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
