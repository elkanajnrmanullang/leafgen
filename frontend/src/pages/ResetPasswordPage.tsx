import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { resetPassword } from "../services/authService";
import logoSrc from "../assets/logo.png";
import { isAxiosError } from "axios";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const location = useLocation();

  const email = location.state?.email;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok.");
      setIsLoading(false);
      return;
    }

    if (!email || !token) {
      setError("Link tidak valid. Silakan ulangi proses lupa password.");
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      navigate("/login", {
        state: {
          message: "Password berhasil diubah. Silakan login.",
          type: "success",
        },
      });
    } catch (err: unknown) {
      setIsLoading(false);
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Token tidak valid atau kedaluwarsa."
        );
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
          <h2 className="text-2xl font-bold text-slate-100">Reset Password</h2>
          <p className="text-slate-300 text-sm mt-2">
            Masukkan password baru Anda.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-300"
            >
              Password Baru
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password baru"
              className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>
          <div>
            <label
              htmlFor="passwordConfirmation"
              className="text-sm font-medium text-slate-300"
            >
              Konfirmasi Password Baru
            </label>
            <input
              id="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              placeholder="Konfirmasi password baru"
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
              {isLoading ? "Memproses..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;