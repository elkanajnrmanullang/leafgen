import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import BankGambarPage from "./pages/BankGambarPage";
import ManajemenAkunPage from "./pages/ManajemenAkunPage";
import React, { useState } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem("authToken");
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem("authToken");
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );
  const userRole = localStorage.getItem("userRole");

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="bank-gambar" element={<BankGambarPage />} />
          <Route
            path="template-desain"
            element={<div>Halaman Template Desain</div>}
          />
          <Route path="history" element={<div>Halaman History</div>} />
          {userRole === "manager" && (
            <Route path="manajemen-akun" element={<ManajemenAkunPage />} />
          )}
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
