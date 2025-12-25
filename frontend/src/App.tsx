import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BankGambarPage from "./pages/BankGambarPage";
import ManajemenAkunPage from "./pages/ManajemenAkunPage";
import BuatLeafletPage from "./pages/BuatLeafletPage";
import PilihTemplatePage from "./pages/PilihTemplatePage";
import EditorPage from "./pages/EditorPage";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <Routes>
      {/* Route Publik */}
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

      {/* Route Protected Standalone (Full Screen tanpa Sidebar Utama) */}
      <Route
        path="/ganti-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Editor Page dipindah kesini agar Full Screen */}
      <Route
        path="/editor/:id"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />

      {/* Route Protected dengan MainLayout (Sidebar & Header) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bank-gambar" element={<BankGambarPage />} />
        <Route path="manajemen-akun" element={<ManajemenAkunPage />} />
        <Route path="buat-leaflet" element={<BuatLeafletPage />} />
        <Route path="pilih-template" element={<PilihTemplatePage />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
