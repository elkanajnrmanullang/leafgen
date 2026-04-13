import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/userService";
import logoSrc from "../assets/logo.png";
import { isAxiosError } from "axios";
import { CheckCircle2 } from "lucide-react";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Keamanan: Jika user mengakses halaman ini tanpa token, lemparkan kembali ke login
    if (!token || !email) {
      navigate("/login", { replace: true });
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Gagal mereset password. Token mungkin sudah tidak valid atau kedaluwarsa."
        );
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src={logoSrc} alt="LeafGenn Logo" className="h-16 mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Buat Password Baru</h2>
        </div>

        {isSuccess ? (
          <div className="bg-slate-700 p-6 rounded-xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">
                Sandi Berhasil Diubah!
              </h3>
              <p className="text-slate-300 text-sm mt-2">
                Kata sandi untuk akun <strong>{email}</strong> telah berhasil
                diperbarui. Silakan login kembali dengan kata sandi baru Anda.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex justify-center w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-slate-800 bg-pastel-blue hover:bg-pastel-blue-dark hover:text-white transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-slate-300 text-sm">
                Silakan buat kata sandi baru untuk akun <br />
                <span className="font-semibold text-blue-300">{email}</span>
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
                  placeholder="Minimal 8 karakter"
                  className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="password_confirmation"
                  className="text-sm font-medium text-slate-300"
                >
                  Ulangi Password Baru
                </label>
                <input
                  id="password_confirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  placeholder="Ulangi password baru"
                  className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
                />
              </div>
              {error && (
                <p className="text-sm text-center text-red-400 pt-2">{error}</p>
              )}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-slate-800 bg-pastel-blue hover:bg-pastel-blue-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Memproses..." : "Simpan Password Baru"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;