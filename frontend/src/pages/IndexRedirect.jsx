import { Navigate } from "react-router-dom";

/** Tanpa landing page: admin → manajemen laporan, warga → peta */
export function IndexRedirect({ me }) {
  if (me?.role === "admin") {
    return <Navigate to="/dashboard/reports" replace />;
  }
  return <Navigate to="/map" replace />;
}
