import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import logoSrc from "../assets/logo.png";
import AlertModal from "../components/AlertModal";

type AlertType = "success" | "error" | "confirm" | "info";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
}

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      setAlertState({
        isOpen: true,
        title: "Error Validasi",
        message: "Password minimal harus 8 karakter.",
        type: "error",
      });
      return;
    }

    if (password !== password_confirmation) {
      setAlertState({
        isOpen: true,
        title: "Error Validasi",
        message: "Konfirmasi password tidak cocok.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        email,
        password,
        password_confirmation,
        token: token || "",
      });
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message: "Password Anda telah berhasil direset. Silakan login kembali.",
        type: "success",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      const message =
        error?.message ||
        "Gagal mereset password. Token mungkin tidak valid atau sudah kedaluwarsa.";
      setAlertState({
        isOpen: true,
        title: "Error",
        message: message,
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
            <h2 className="text-2xl font-bold text-slate-800">
              Reset Password Anda
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email-reset"
                className="text-sm font-medium text-slate-700"
              >
                Alamat Email
              </label>
              <input
                id="email-reset"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@perusahaanx.com"
                className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
              />
            </div>
            <div>
              <label
                htmlFor="password-new"
                className="text-sm font-medium text-slate-700"
              >
                Password Baru
              </label>
              <input
                id="password-new"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimal 8 karakter"
                className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
              />
            </div>
            <div>
              <label
                htmlFor="password-confirm"
                className="text-sm font-medium text-slate-700"
              >
                Konfirmasi Password Baru
              </label>
              <input
                id="password-confirm"
                type="password"
                value={password_confirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                placeholder="Ulangi password baru"
                className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </div>
          </form>
          <div className="text-sm text-center text-slate-600 pt-2">
            <Link to="/login" className="font-medium hover:underline">
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

export default ResetPasswordPage;
