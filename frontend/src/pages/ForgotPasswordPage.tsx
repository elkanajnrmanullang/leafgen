import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import logoSrc from "../assets/logo.png";
import { isAxiosError } from "axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await forgotPassword(email);
      const token = response.token;

      if (!token) {
        throw new Error("Respon API tidak valid, token tidak ditemukan.");
      }

      navigate(`/reset-password/${token}`, { state: { email: email } });
    } catch (err: unknown) {
      setIsLoading(false);
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          navigate("/login", {
            state: {
              message: "Gagal memproses permintaan. Silakan coba lagi.",
              type: "error",
            },
          });
        } else {
          setError("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
        }
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src={logoSrc} alt="LeafGenn Logo" className="h-16 mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Lupa Password</h2>
          <p className="text-slate-300 text-sm mt-2">
            Masukkan email Anda untuk melanjutkan proses reset password.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Masukkan email terdaftar"
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
              {isLoading ? "Memproses..." : "Lanjutkan"}
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-slate-400">
          <Link
            to="/login"
            className="font-medium text-blue-400 hover:underline"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
