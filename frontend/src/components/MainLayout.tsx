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
import AlertModal from "./AlertModal";
import { useInactivityTimeout } from "../hooks/useInactivityTimeout";
import InactivityModal from "./InactivityModal";
import { useAuth } from "../context/AuthContext";
import ProductUploadModal from "./ProductUploadModal";

interface Product {
  id: number;
  plu_code: string;
  name: string;
  image_path: string;
}

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
  const { logoutAction } = useAuth();
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail") || "user@example.com";

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(
    undefined
  );

  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const {
    showModal: showInactivityModal,
    handleContinue: handleInactivityContinue,
    handleLogout: handleInactivityLogout,
  } = useInactivityTimeout(logoutAction);

  const navLinks = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/buat-leaflet", label: "Buat Leaflet", icon: FilePlus2 },
      { to: "/bank-gambar", label: "Bank Gambar", icon: Archive },
      {
        to: "/manajemen-template", // Updated link to point to the management page
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
    // Normalisasi path untuk menghindari trailing slash issue
    const currentPath = location.pathname.endsWith("/")
      ? location.pathname.slice(0, -1)
      : location.pathname;

    // Handle root path
    const normalizedPath = currentPath === "" ? "/dashboard" : currentPath;

    const currentLink = navLinks.find(
      (link) =>
        normalizedPath === link.to || normalizedPath.startsWith(`${link.to}/`)
    );

    if (currentLink) {
      setPageTitle(currentLink.label);
    } else {
      setPageTitle("LeafGenn");
    }
  }, [location, navLinks]);

  const handleOpenProductModal = (product?: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setProductToEdit(undefined);
    setIsProductModalOpen(false);
  };

  return (
    <>
      <div className="flex min-h-screen bg-pastel-bg">
        <aside
          className={`w-64 bg-slate-800 text-slate-300 fixed inset-y-0 left-0 transform ${
            !isSidebarOpen && "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}
        >
          <div className="h-20 flex items-center justify-center flex-shrink-0 px-4 border-b border-white/20">
            <img src={logoSrc} alt="LeafGenn Logo" className="h-12" />
          </div>
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              if (link.role && link.role !== userRole) return null;

              // Logic Active State yang lebih aman
              const isActive =
                location.pathname === link.to ||
                location.pathname.startsWith(`${link.to}/`);

              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white shadow-sm"
                      : "hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-3 flex-1 truncate">{link.label}</span>
                  {link.label === "Manajemen Akun" && (
                    <span className="text-xs bg-yellow-300 text-slate-800 font-bold px-2 py-0.5 rounded-full ml-auto">
                      Manager
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={logoutAction}
              className="w-full flex items-center px-3 py-2.5 font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <div className="flex-1 flex flex-col md:ml-64">
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden mr-4 text-slate-600 focus:outline-none hover:bg-slate-100 p-2 rounded-md"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
                {pageTitle}
              </h2>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-800 capitalize text-sm md:text-base">
                {userRole}
              </p>
              <p className="text-xs md:text-sm text-slate-500">{userEmail}</p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
            <Outlet context={{ openProductModal: handleOpenProductModal }} />
          </main>
        </div>
      </div>

      <ProductUploadModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        productToEdit={productToEdit}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      <InactivityModal
        isOpen={showInactivityModal}
        onContinue={handleInactivityContinue}
        onLogout={handleInactivityLogout}
      />
    </>
  );
};

export default MainLayout;