import { useState } from "react";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { apiErr } from "../utils/errors";
import logo from "../assets/logo.png";

export function AuthPage({ mode, onSuccess }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "warga" });
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const path = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister 
        ? { fullName: form.fullName, email: form.email, password: form.password, role: form.role } 
        : { email: form.email, password: form.password };
      const res = await api.post(path, payload);
      
      if (isRegister && (form.role === "pengawas" || form.role === "armada")) {
        toast.success("Registrasi berhasil! Akun Anda sedang menunggu persetujuan Admin.", { duration: 6000 });
        navigate("/login");
      } else {
        toast.success(isRegister ? "Pendaftaran berhasil" : "Login berhasil");
        onSuccess(res.data.token);
      }
    } catch (err) {
      toast.error(apiErr(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img
            src={logo}
            alt="SOMPAH PALOPO"
            className="h-28 w-auto max-w-[260px] object-contain object-center md:h-32"
          />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-4 text-center text-xl font-semibold text-slate-800">{isRegister ? "Register" : "Login"}</h2>
          <form className="space-y-3" onSubmit={submit}>
            {isRegister && (
              <>
                <label className="block text-sm">
                  Nama Lengkap
                  <input
                    className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </label>
                <label className="block text-sm">
                  Daftar Sebagai
                  <select
                    className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100 font-medium text-slate-700 bg-white"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="warga">Warga</option>
                    <option value="pengawas">Pengawas Lingkungan (Verifikator)</option>
                    <option value="armada">Petugas Kebersihan (Armada)</option>
                  </select>
                </label>
              </>
            )}
            <label className="block text-sm">
              Email
              <input
                className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={submitting}
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                disabled={submitting}
              />
            </label>
            {isRegister && (
              <p className="text-xs text-slate-500">
                {form.role === "warga"
                  ? "Pendaftaran sebagai warga langsung aktif."
                  : "Akun Pengawas/Armada memerlukan persetujuan manual dari Admin sebelum dapat digunakan."}
              </p>
            )}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              <LogIn size={16} /> {submitting ? "Memuat..." : isRegister ? "Daftar" : "Masuk"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegister ? (
            <>
              Sudah punya akun?{" "}
              <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
                Masuk
              </Link>
            </>
          ) : (
            <>
              Belum punya akun?{" "}
              <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
                Daftar
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
