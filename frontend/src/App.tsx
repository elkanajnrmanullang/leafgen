import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import React from "react";

import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BankGambarPage from "./pages/BankGambarPage";
import ManajemenAkunPage from "./pages/ManajemenAkunPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("authToken");
  const mustChangePassword = !!localStorage.getItem("passwordChangeReason");

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (mustChangePassword && location.pathname !== "/ganti-password") {
    return <Navigate to="/ganti-password" />;
  }

  if (!mustChangePassword && location.pathname === "/ganti-password") {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem("authToken");
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/lupa-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      <Route
        path="/ganti-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="bank-gambar" element={<BankGambarPage />} />
        <Route path="manajemen-akun" element={<ManajemenAkunPage />} />
      </Route>
    </Routes>
  );
}

export default App;
