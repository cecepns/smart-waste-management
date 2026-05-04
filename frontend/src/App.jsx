import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { api } from "./api/client";
import { AdminRoute } from "./components/layout/AdminRoute";
import { ProtectedShell } from "./components/layout/ProtectedShell";
import { IndexRedirect } from "./pages/IndexRedirect";
import { LocationsPage } from "./pages/dashboard/LocationsPage";
import { ReportsPage } from "./pages/dashboard/ReportsPage";
import { UsersPage } from "./pages/dashboard/UsersPage";
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
    navigate("/login", { replace: true });
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
          path="/login"
          element={isLogged ? <Navigate to="/" replace /> : <LoginPage onSuccess={onLogin} />}
        />
        <Route
          path="/register"
          element={isLogged ? <Navigate to="/" replace /> : <RegisterPage onSuccess={onLogin} />}
        />

        <Route path="/" element={<ProtectedShell token={token} me={me} onLogout={onLogout} />}>
          <Route index element={<IndexRedirect me={me} />} />
          <Route path="map" element={<MapPage token={token} />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="dashboard" element={<Navigate to="/dashboard/reports" replace />} />
          <Route element={<AdminRoute me={me} />}>
            <Route path="dashboard/reports" element={<ReportsPage />} />
            <Route path="dashboard/locations" element={<LocationsPage />} />
            <Route path="dashboard/users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
