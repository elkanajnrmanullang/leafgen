import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import logoSrc from "../assets/logo.png";
import AlertModal from "../components/AlertModal";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as const,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setAlertState({
        isOpen: true,
        title: "Link Terkirim",
        message:
          "Link Reset Password dikirim ke email Anda",
        type: "success",
      });
    } catch (error) {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal mengirim link. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="w-full max-w-sm p-8 space-y-6 bg-slate-400 rounded-2xl shadow-xl">
          <div className="text-center">
            <img
              src={logoSrc}
              alt="LeafGenn Logo"
              className="h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-slate-800">Lupa Password</h2>
            <p className="text-black mt-2 text-sm">
              Masukkan email Anda di bawah ini.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@perusahaanx.com"
                className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </div>
          </form>

          <div className="text-sm text-center text-slate-600">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:underline"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </>
  );
};

export default ForgotPasswordPage;
