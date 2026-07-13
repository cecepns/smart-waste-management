import { Navigate, Outlet } from "react-router-dom";
import { PanelLayout } from "./PanelLayout";

/** Memuat panel hanya untuk pengguna terlogin; tamu diarahkan ke login. */
export function ProtectedShell({ token, me, onLogout }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Memuat sesi…
      </div>
    );
  }
  return (
    <PanelLayout me={me} onLogout={onLogout}>
      <Outlet context={{ me }} />
    </PanelLayout>
  );
}
