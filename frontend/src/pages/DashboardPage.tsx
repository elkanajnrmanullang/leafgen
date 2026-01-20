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
  Image as ImageIcon,
  Layout,
  History
} from "lucide-react";

interface AppContext {
  openProductModal: () => void;
}

interface Activity {
  id: number;
  text: string;
  date?: string;
  type?: string;
  user?: string;
}

const DashboardPage = () => {
  const { openProductModal } = useOutletContext<AppContext>();

  const [stats, setStats] = useState({ leaflet: 0, produk: 0, template: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchStats = async () => {
    try {
      const products = await getProducts();
      const templates = await LeafletService.getTemplates();
      const dashboardData = await LeafletService.getDashboardStats();

      setStats({
        produk: products ? products.length : 0,
        template: templates ? templates.length : 0,
        leaflet: dashboardData.total_leaflets || 0,
      });

      if (dashboardData.recent_activities && dashboardData.recent_activities.length > 0) {
         setActivities(dashboardData.recent_activities);
      } else {
         setActivities([
           { id: 0, text: "Belum ada aktivitas terbaru.", type: 'system' }
         ]);
      }

    } catch (error) {
      console.error("Gagal mengambil statistik dashboard:", error);
    }
  };

  useEffect(() => {
    fetchStats();

    const intervalId = setInterval(() => {
      fetchStats();
    }, 5000);

    const handleProductChange = () => fetchStats();
    window.addEventListener("productAdded", handleProductChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("productAdded", handleProductChange);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Leaflet Selesai
              </h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.leaflet}
              </p>
            </div>
          </div>

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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col max-h-[500px]">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              Aktivitas Terakhir (Real-time)
            </h3>
          </div>
          
          <div className="p-6 pt-0 overflow-y-auto">
            <ul className="space-y-0 divide-y divide-slate-100">
              {activities.map((activity) => {
                let Icon = FilePlus2;
                let bgClass = "bg-blue-50 border-blue-100";
                let textClass = "text-blue-500";

                if (activity.type === 'product') {
                    Icon = ImageIcon;
                    bgClass = "bg-emerald-50 border-emerald-100";
                    textClass = "text-emerald-500";
                } else if (activity.type === 'template') {
                    Icon = Layout;
                    bgClass = "bg-amber-50 border-amber-100";
                    textClass = "text-amber-500";
                }

                return (
                  <li key={activity.id} className="flex items-start gap-4 py-4">
                    <div className={`p-2.5 rounded-full border shrink-0 ${bgClass}`}>
                      <Icon className={`h-5 w-5 ${textClass}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700 leading-snug">
                          {activity.text}
                        </p>
                        {activity.date && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">{activity.date}</span>
                            </div>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
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