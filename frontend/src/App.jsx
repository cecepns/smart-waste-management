import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { api } from "./api/client";
import { AdminRoute } from "./components/layout/AdminRoute";
import { ProtectedShell } from "./components/layout/ProtectedShell";
import { EducationPage } from "./pages/EducationPage";
import { LandingPage } from "./pages/LandingPage";
import { LocationsPage } from "./pages/dashboard/LocationsPage";
import { ReportsPage } from "./pages/dashboard/ReportsPage";
import { UsersPage } from "./pages/dashboard/UsersPage";
import { StatsPage } from "./pages/dashboard/StatsPage";
import { WasteLogsPage } from "./pages/dashboard/WasteLogsPage";
import { LoginPage } from "./pages/LoginPage";
import { MapPage } from "./pages/MapPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReportPage } from "./pages/ReportPage";
import { tokenStore } from "./utils/tokenStore";

export default function App() {
  const [token, setToken] = useState(tokenStore.get());
  const [me, setMe] = useState(null);
  const navigate = useNavigate();
  const isLogged = Boolean(token);

  useEffect(() => {
    api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : "";
    if (!token) {
      setMe(null);
      return;
    }
    api
      .get("/me")
      .then((res) => setMe(res.data))
      .catch(() => {
        tokenStore.remove();
        setToken(null);
      });
  }, [token]);

  const onLogin = (nextToken) => {
    tokenStore.set(nextToken);
    setToken(nextToken);
    navigate("/", { replace: true });
  };

  const onLogout = () => {
    tokenStore.remove();
    setToken(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#1e293b",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
          },
          success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            token && !me ? (
              <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
                Memuat sesi…
              </div>
            ) : token && me ? (
              <Navigate to={me.role === "admin" ? "/dashboard/reports" : "/map"} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        <Route
          path="/login"
          element={isLogged ? <Navigate to="/" replace /> : <LoginPage onSuccess={onLogin} />}
        />
        <Route
          path="/register"
          element={isLogged ? <Navigate to="/" replace /> : <RegisterPage onSuccess={onLogin} />}
        />

        <Route element={<ProtectedShell token={token} me={me} onLogout={onLogout} />}>
          <Route path="/map" element={<MapPage token={token} me={me} />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/edukasi" element={<EducationPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/reports" replace />} />
          <Route element={<AdminRoute me={me} />}>
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            <Route path="/dashboard/locations" element={<LocationsPage />} />
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="/dashboard/stats" element={<StatsPage />} />
            <Route path="/dashboard/waste-logs" element={<WasteLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
