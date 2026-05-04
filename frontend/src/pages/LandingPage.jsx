import { Link } from "react-router-dom";
import { ArrowRight, Leaf, LogIn, UserPlus } from "lucide-react";
import heroImage from "../assets/landing-hero.png";
import logo from "../assets/logo.png";

/** Halaman depan publik: ajakan masuk atau daftar */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <img src={logo} alt="Smart Waste Management" className="h-10 md:h-16 w-auto object-contain object-left md:h-11" />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:px-4"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 md:px-4"
            >
              <UserPlus size={18} />
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 md:px-6 md:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                <Leaf size={14} className="shrink-0" />
                Pengelolaan sampah cerdas
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-[2.75rem]">
                Pantau titik sampah, laporkan kondisi, dan dukung lingkungan lebih bersih.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Bergabunglah untuk melihat peta pemantauan, mengirim laporan dari lokasi Anda, serta mengakses edukasi pengelolaan
                sampah dan limbah B3 — dalam satu platform.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
                >
                  <LogIn size={20} />
                  Masuk ke akun
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-6 py-3.5 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Buat akun warga
                  <ArrowRight size={20} />
                </Link>
              </div>

              <p className="mt-10 text-sm text-slate-500">
                Belum punya akses? Daftar sebagai warga untuk mulai melapor. Akun admin dibuat oleh pengelola sistem.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-none">
                <img
                  src={heroImage}
                  alt="Ilustrasi masyarakat membersihkan lingkungan dan mendaur ulang sampah"
                  className="mx-auto h-auto w-full max-h-[min(68vh,560px)] object-contain object-bottom drop-shadow-md select-none"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Smart Waste Management — edukasi & partisipasi masyarakat untuk kota lebih bersih.
      </footer>
    </div>
  );
}
