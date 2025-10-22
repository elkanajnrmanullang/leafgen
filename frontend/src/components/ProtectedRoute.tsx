import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("authToken");
  const mustChangePassword = !!localStorage.getItem("passwordChangeReason");

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && location.pathname !== "/ganti-password") {
    return <Navigate to="/ganti-password" replace />;
  }

  if (!mustChangePassword && location.pathname === "/ganti-password") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
