import { useState, useEffect } from "react";
import { login } from "../services/authService";
import logoSrc from "../assets/logo.png";

interface ApiError {
  message: string;
  errors?: { [key: string]: string[] };
}

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await login(username, password);
      if (data.access_token) {
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("userRole", data.user.role);
        setSuccessMessage(`Login Berhasil sebagai ${data.user.role}!`);
        setLoginSuccess(true);
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
    <>
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-start px-4 py-6 sm:p-6 z-50"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <div
            className={`
              pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5
              transform transition-all duration-300 ease-in-out
              ${
                loginSuccess
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0"
              }
            `}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    Login Berhasil!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen bg-slate-200">
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="flex flex-col items-center justify-center mb-4">
              <img src={logoSrc} alt="LeafGenn Logo" className="h-12 mb-2" />
            </div>
            <p className="text-slate-500 text-m">
              Silakan login untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-slate-400"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-400 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
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
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {error && (
              <p className="text-sm text-center text-red-400 pt-2">{error}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-slate-800 bg-[#a7c7e7] hover:bg-[#89a7c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#89a7c7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Memproses..." : "Login"}
              </button>
            </div>
          </form>

          <div className="text-m text-slate-400 text-center pt-4">
            <p>LeafGenn @2025</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
