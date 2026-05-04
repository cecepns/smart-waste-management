import { Navigate, Outlet } from "react-router-dom";

export function AdminRoute({ me }) {
  if (me?.role !== "admin") {
    return <Navigate to="/map" replace />;
  }
  return <Outlet />;
}
