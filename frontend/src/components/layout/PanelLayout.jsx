import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Layers, LogOut, MapPin, Menu, Send, Shield, Users, X } from "lucide-react";
import logo from "../../assets/logo.png";
import { roleBadge } from "../../utils/roleBadge";

function navLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-emerald-100 text-emerald-800" : "text-slate-600 hover:bg-slate-100"
  }`;
}

export function PanelLayout({ me, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = me?.role === "admin";
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          aria-label="Tutup menu samping"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4 lg:h-16">
          <NavLink to="/" onClick={closeMobile} className="min-w-0 flex-1">
            <img src={logo} alt="Smart Waste Management" className="h-9 w-auto max-w-[92%] object-contain object-left" />
          </NavLink>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={closeMobile}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Utama</p>
          <NavLink to="/map" className={navLinkClass} onClick={closeMobile}>
            <MapPin size={18} />
            Peta
          </NavLink>
          <NavLink to="/report" className={navLinkClass} onClick={closeMobile}>
            <Send size={18} />
            Laporkan Kondisi
          </NavLink>

          {isAdmin && (
            <>
              <p className="mb-2 mt-5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Administrasi</p>
              <NavLink to="/dashboard/reports" className={navLinkClass} onClick={closeMobile}>
                <Shield size={18} />
                Manajemen Laporan
              </NavLink>
              <NavLink to="/dashboard/locations" className={navLinkClass} onClick={closeMobile}>
                <Layers size={18} />
                Manajemen Lokasi
              </NavLink>
              <NavLink to="/dashboard/users" className={navLinkClass} onClick={closeMobile}>
                <Users size={18} />
                Manajemen Users
              </NavLink>
            </>
          )}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={roleBadge(me.role)}>{me.role === "admin" ? "Admin" : "Warga"}</span>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>
          <span className="truncate text-sm font-semibold text-slate-800">Menu</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
