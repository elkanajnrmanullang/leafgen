import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login as apiLogin } from "../services/authService";

interface AuthContextType {
  token: string | null;
  userRole: string | null;
  userName: string | null;
  loginAction: (username: string, password: string) => Promise<void>;
  logoutAction: () => void;
}

interface UserData {
  access_token: string;
  user: {
    role: string;
    name: string; // Sesuai mapping auth controller terbaru
    email: string; // Sesuai mapping auth controller terbaru
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem("userRole")
  );
  const [userName, setUserName] = useState<string | null>(
    localStorage.getItem("userName")
  );
  const navigate = useNavigate();
  const location = useLocation();

  const loginAction = async (username: string, password: string) => {
    const data: UserData = await apiLogin(username, password);

    setToken(data.access_token);
    setUserRole(data.user.role);
    setUserName(data.user.name);
    
    localStorage.setItem("authToken", data.access_token);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userEmail", data.user.email);

    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
  };

  const logoutAction = () => {
    setToken(null);
    setUserRole(null);
    setUserName(null);
    localStorage.clear();
    navigate("/login");
  };

  const value = {
    token,
    userRole,
    userName,
    loginAction,
    logoutAction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};