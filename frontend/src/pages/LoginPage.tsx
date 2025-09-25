import { useState } from "react";
import { login } from "../services/authService";
import logoSrc from "../assets/logo.png";

interface ApiError {
  message: string;
  errors?: { [key: string]: string[] };
}

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await login(username, password);
      if (data.access_token) {
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        onLoginSuccess();
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      if (apiError && apiError.message) {
        setError(apiError.message);
      } else {
        setError("Login gagal. Periksa kembali koneksi atau kredensial Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src={logoSrc} alt="LeafGenn Logo" className="h-12 mb-2" />
          </div>
          <p className="text-slate-300 text-sm">
            Silakan login untuk melanjutkan
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="text-sm font-medium text-slate-300"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>
          {error && (
            <p className="text-sm text-center text-red-400 pt-2">{error}</p>
          )}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-slate-800 bg-pastel-blue hover:bg-pastel-blue-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Login"}
            </button>
          </div>
        </form>
        <div className="text-xs text-slate-500 text-center pt-4">
          <p>LeafGenn @2025</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
