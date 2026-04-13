import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/userService";
import logoSrc from "../assets/logo.png";
import { isAxiosError } from "axios";
import { CheckCircle2, Mail } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError("Email tidak ditemukan di dalam sistem kami.");
        } else {
          setError(err.response?.data?.message || "Terjadi kesalahan pada server. Silakan coba lagi nanti.");
        }
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
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
            <img src={logoSrc} alt="LeafGenn Logo" className="h-16 mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Lupa Password</h2>
        </div>

        {isSuccess ? (
            <div className="bg-slate-700 p-6 rounded-xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="p-3 bg-emerald-500/20 rounded-full">
                        <Mail className="h-10 w-10 text-emerald-400" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-400">Email Terkirim!</h3>
                    <p className="text-slate-300 text-sm mt-2">
                        Kami telah mengirimkan tautan pemulihan kata sandi ke <strong>{email}</strong>. 
                        Silakan periksa kotak masuk atau folder spam Anda.
                    </p>
                </div>
                <div className="pt-4">
                    <Link
                        to="/login"
                        className="inline-flex justify-center w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors"
                    >
                        Kembali ke Halaman Login
                    </Link>
                </div>
            </div>
        ) : (
            <>
                <div className="text-center">
                    <p className="text-slate-300 text-sm">
                        Masukkan email Anda untuk melanjutkan proses reset password.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-300"
                    >
                    Email Terdaftar
                    </label>
                    <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Contoh: user@leafgenn.com"
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
                    {isLoading ? "Mengirim Email..." : "Kirim Tautan Reset"}
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
            </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;