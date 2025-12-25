import { useState } from "react";
// import { LeafletItem } from '../data/dummyLeafletData';
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    // Simulasi kirim email
    setTimeout(() => {
      setStatus("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Lupa Kata Sandi?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Masukkan email Anda untuk menerima link reset.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100">
          {status === "success" ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Email Terkirim!
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Silakan periksa kotak masuk (dan spam) email Anda untuk
                instruksi selanjutnya.
              </p>
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Alamat Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="nama@perusahaan.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Mengirim..." : "Kirim Link Reset"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  Ingat kata sandi?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
