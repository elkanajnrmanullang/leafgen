import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { getProducts } from "../services/productService";
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
  const [stats, setStats] = useState({ leaflet: 2, produk: 0, template: 2 });
  const [activities] = useState([
    { id: 1, icon: FilePlus2, text: "Leaflet baru LFG-002 dibuat." },
    { id: 2, icon: Plus, text: "Produk baru Air Mineral ditambahkan." },
  ]);

  const fetchProductCount = async () => {
    try {
      const products = await getProducts();
      setStats((prevStats) => ({ ...prevStats, produk: products.length }));
    } catch (error) {
      console.error("Gagal mengambil jumlah produk:", error);
    }
  };

  useEffect(() => {
    fetchProductCount();

    const handleProductChange = () => fetchProductCount();

    window.addEventListener("productAdded", handleProductChange);

    return () => {
      window.removeEventListener("productAdded", handleProductChange);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">
                Total Leaflet
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.leaflet}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Archive className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">
                Produk di Bank
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.produk}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <LayoutTemplate className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">
                Template Desain
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.template}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Aktivitas Terakhir
          </h3>
          <ul className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <li key={activity.id} className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-full">
                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-600">{activity.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Jalan Pintas
        </h3>
        <div className="space-y-4">
          <Link
            to="/buat-leaflet"
            className="w-full flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-full">
              <FileUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-left">
                Buat dari CSV
              </p>
              <p className="text-sm text-slate-500 text-left">
                Mulai alur kerja utama
              </p>
            </div>
          </Link>
          <button
            onClick={openProductModal}
            className="w-full flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-full">
              <PlusCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-left">
                Tambah Produk
              </p>
              <p className="text-sm text-slate-500 text-left">
                Isi data ke Bank Gambar
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
