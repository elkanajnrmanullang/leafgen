import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import logoSrc from "../assets/logo.png";

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");

  const navLinks = [
    { to: "/", label: "Dashboard", icon: "layout-dashboard" },
    { to: "/bank-gambar", label: "Bank Gambar", icon: "archive" },
    {
      to: "/template-desain",
      label: "Template Desain",
      icon: "layout-template",
    },
    { to: "/history", label: "History", icon: "history" },
    {
      to: "/manajemen-akun",
      label: "Manajemen Akun",
      icon: "users",
      role: "manager",
    },
  ];

  useEffect(() => {
    const currentLink = navLinks.find((link) => link.to === location.pathname);
    if (currentLink) {
      setPageTitle(currentLink.label);
    }
  }, [location, navLinks]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen">
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${
          !isSidebarOpen && "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <aside
        className={`w-64 bg-slate-800 text-white fixed inset-y-0 left-0 transform ${
          !isSidebarOpen && "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-center flex-shrink-0 px-4 border-b border-white/20">
          <img src={logoSrc} alt="LeafGenn Logo" className="h-9 w-9" />
          <h1 className="text-2xl font-bold ml-2">LeafGenn</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            if (link.role && link.role !== userRole) return null;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center px-3 py-2.5 font-medium rounded-lg transition-colors ${
                  isActive ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <svg className="lucide lucide-layout-dashboard h-5 w-5">
                  <use
                    href={`https://unpkg.com/lucide-static@latest/icons/${link.icon}.svg#${link.icon}`}
                  ></use>
                </svg>
                <span className="ml-3">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 font-medium hover:bg-pastel-red hover:text-slate-800 rounded-lg transition-colors"
          >
            <svg className="lucide lucide-log-out h-5 w-5">
              <use href="https://unpkg.com/lucide-static@latest/icons/log-out.svg#log-out"></use>
            </svg>
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden mr-4 text-slate-600"
            >
              <svg className="lucide lucide-menu h-6 w-6">
                <use href="https://unpkg.com/lucide-static@latest/icons/menu.svg#menu"></use>
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-slate-800">
              {pageTitle}
            </h2>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-pastel-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
