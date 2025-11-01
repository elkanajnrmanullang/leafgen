import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  return !token ? <>{children}</> : <Navigate to="/" replace />;
};

export default PublicRoute;
