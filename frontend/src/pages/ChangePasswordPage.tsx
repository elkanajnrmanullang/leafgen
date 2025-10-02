import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModal";
import { changePassword } from "../services/authService";
import logoSrc from "../assets/logo.png";

type AlertType = "success" | "error" | "confirm" | "info";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
}

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const reason = localStorage.getItem("passwordChangeReason");

  const pageInfo = useMemo(() => {
    if (reason === "NEW_USER") {
      return {
        title: "Buat Password Baru Anda",
        subtitle:
          "Karena ini login pertama Anda, silakan buat password baru yang aman.",
      };
    }
    if (reason === "EXPIRED_PASSWORD") {
      return {
        title: "Perbarui Password Anda",
        subtitle:
          "Demi keamanan, Anda wajib memperbarui password Anda secara berkala setiap 30 hari.",
      };
    }
    return {
      title: "Ganti Password",
      subtitle: "Silakan perbarui password Anda untuk melanjutkan.",
    };
  }, [reason]);

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
      await changePassword({ password, password_confirmation });
      localStorage.removeItem("passwordChangeReason");
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message:
          "Password Anda telah berhasil diperbarui. Mengarahkan ke Dashboard...",
        type: "success",
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal mengubah password. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-slate-200">
        <div className="w-full max-w-sm p-8 space-y-6 bg-slate-400 rounded-2xl shadow-xl">
          <div className="text-center">
            <img
              src={logoSrc}
              alt="LeafGenn Logo"
              className="h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-slate-800">
              {pageInfo.title}
            </h2>
            <p className="mt-2 text-sm text-white">{pageInfo.subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-slate-50 border-slate-300 text-sm"
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
                className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-slate-50 border-slate-300 text-sm"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex justify-center w-full px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-md shadow-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                {isLoading ? "Menyimpan..." : "Simpan & Lanjutkan"}
              </button>
            </div>
          </form>
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

export default ChangePasswordPage;
