import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { token } = useAuth();
  const mustChangePassword = !!localStorage.getItem("passwordChangeReason");

  if (!token) {
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
