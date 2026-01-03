import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { getProducts } from "../services/productService";
import { LeafletService } from "../services/leafletService";
import {
  FileSpreadsheet,
  Archive,
  LayoutTemplate,
  FileUp,
  PlusCircle,
  FilePlus2,
  Plus,
} from "lucide-react";

interface AppContext {
  openProductModal: () => void;
}

const DashboardPage = () => {
  const { openProductModal } = useOutletContext<AppContext>();

  // Inisialisasi semua stats dengan 0
  const [stats, setStats] = useState({ leaflet: 0, produk: 0, template: 0 });

  const [activities] = useState([
    { id: 1, icon: FilePlus2, text: "Leaflet baru LFG-002 dibuat." },
    { id: 2, icon: Plus, text: "Produk baru Air Mineral ditambahkan." },
  ]);

  const fetchStats = async () => {
    try {
      // 1. Fetch Produk
      const products = await getProducts();

      // 2. Fetch Templates
      const templates = await LeafletService.getTemplates();

      // 3. Fetch Leaflets (History) - Jika ingin dinamis juga
      // const leaflets = await LeafletService.getHistory();

      setStats((prevStats) => ({
        ...prevStats,
        produk: products.length,
        template: templates.length,
        // leaflet: leaflets.length // Uncomment jika endpoint history sudah siap
      }));
    } catch (error) {
      console.error("Gagal mengambil statistik dashboard:", error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listener untuk update real-time jika ada penambahan produk
    const handleProductChange = () => fetchStats();
    window.addEventListener("productAdded", handleProductChange);

    return () => {
      window.removeEventListener("productAdded", handleProductChange);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Leaflet */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Leaflet
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.leaflet}
              </p>
            </div>
          </div>

          {/* Card Produk */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Archive className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Produk di Bank
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.produk}
              </p>
            </div>
          </div>

          {/* Card Template (UPDATED: Data Real) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="p-3 bg-amber-50 rounded-xl">
              <LayoutTemplate className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Template Desain
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.template}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            Aktivitas Terakhir
          </h3>
          <ul className="space-y-0">
            {activities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <li
                  key={activity.id}
                  className={`flex items-center gap-4 py-4 ${
                    idx !== activities.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="p-2.5 bg-slate-50 rounded-full border border-slate-100">
                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    {activity.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="space-y-4">
            <Link
              to="/buat-leaflet"
              className="w-full flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                <FileUp className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  Buat dari Excel
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mulai generate desain
                </p>
              </div>
            </Link>
            <button
              onClick={openProductModal}
              className="w-full flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  Tambah Produk
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload ke Bank Gambar
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
