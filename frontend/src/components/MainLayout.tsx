import { useState, useEffect, useMemo } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import logoSrc from "../assets/logo.png";
import {
  LayoutDashboard,
  FilePlus2,
  Archive,
  LayoutTemplate,
  History,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { addProduct } from "../services/productService";
import AlertModal from "./AlertModal";

type AlertType = "success" | "error" | "confirm" | "info";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  onConfirm?: () => void;
}

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail") || "user@example.com";

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPlu, setNewProductPlu] = useState("");
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const navLinks = useMemo(
    () => [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/buat-leaflet", label: "Buat Leaflet", icon: FilePlus2 },
      { to: "/bank-gambar", label: "Bank Gambar", icon: Archive },
      {
        to: "/template-desain",
        label: "Template Desain",
        icon: LayoutTemplate,
      },
      { to: "/history", label: "History", icon: History },
      {
        to: "/manajemen-akun",
        label: "Manajemen Akun",
        icon: Users,
        role: "manager",
      },
    ],
    []
  );

  useEffect(() => {
    const currentLink = navLinks.find((link) => link.to === location.pathname);
    if (currentLink) {
      setPageTitle(currentLink.label);
    }
  }, [location, navLinks]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProductImage) {
      setAlertState({
        isOpen: true,
        title: "Peringatan",
        message: "Silakan pilih file gambar.",
        type: "info",
      });
      return;
    }
    const formData = new FormData();
    formData.append("name", newProductName);
    formData.append("plu_code", newProductPlu);
    formData.append("image_file", newProductImage);
    try {
      await addProduct(formData);
      setIsProductModalOpen(false);
      setNewProductName("");
      setNewProductPlu("");
      setNewProductImage(null);
      (e.target as HTMLFormElement).reset();
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message: "Produk baru berhasil ditambahkan!",
        type: "success",
      });
      window.dispatchEvent(new CustomEvent("productAdded"));
    } catch (addError) {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal menambah produk. Pastikan Kode PLU unik.",
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-pastel-bg">
        <aside
          className={`w-64 bg-slate-800 text-slate-300 fixed inset-y-0 left-0 transform ${
            !isSidebarOpen && "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}
        >
          <div className="h-16 flex items-center justify-center flex-shrink-0 px-4 border-b border-white/20">
            <img src={logoSrc} alt="LeafGenn Logo" className="h-12" />
          </div>
          <nav className="flex-1 px-4 py-2 space-y-1">
            {navLinks.map((link) => {
              if (link.role && link.role !== userRole) return null;
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2.5 font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="ml-3 flex-1">{link.label}</span>
                  {link.label === "Manajemen Akun" && (
                    <span className="text-xs bg-yellow-300 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                      Manager
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 font-medium hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col md:ml-64">
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden mr-4 text-slate-600"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-semibold text-slate-800">
                {pageTitle}
              </h2>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-800 capitalize">
                {userRole}
              </p>
              <p className="text-sm text-slate-500">{userEmail}</p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet
              context={{ openProductModal: () => setIsProductModalOpen(true) }}
            />
          </main>
        </div>
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddProduct}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Tambah Produk Baru</h3>
            </div>
            <div className="p-6 space-y-4">
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
                placeholder="Nama Barang"
                className="w-full p-2 border rounded-md"
              />
              <input
                value={newProductPlu}
                onChange={(e) => setNewProductPlu(e.target.value)}
                required
                placeholder="Kode PLU Unit"
                className="w-full p-2 border rounded-md"
              />
              <input
                onChange={(e) =>
                  e.target.files && setNewProductImage(e.target.files[0])
                }
                required
                type="file"
                accept="image/jpeg, image/png"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-pastel-blue-dark hover:file:bg-blue-100"
              />
            </div>
            <div className="p-6 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-pastel-blue hover:bg-pastel-blue-dark text-slate-800 font-semibold"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </>
  );
};

export default MainLayout;
