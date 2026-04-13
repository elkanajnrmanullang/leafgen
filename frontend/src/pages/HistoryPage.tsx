import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LeafletService } from "../services/leafletService";
import {
  Search,
  Calendar,
  MoreVertical,
  Edit3,
  Trash2,
  FileText,
  Clock,
  Filter,
  CheckCircle2,
  FileClock
} from "lucide-react";

interface HistoryItem {
  id: number;
  title: string;
  store: string;
  date: string;
  thumbnailUrl: string | null;
  status: "draft" | "exported" | "Selesai" | "Draft" | "completed";
  pageCount: number;
}

const HistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await LeafletService.getHistory();
        setHistoryData(data);
      } catch (error) {
        console.error("Gagal memuat riwayat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleEdit = async (item: HistoryItem) => {
    setIsLoading(true);
    try {
      const data = await LeafletService.getLeafletById(item.id);
      
      navigate("/editor", {
        state: {
          leafletData: data.pages, 
          leafletName: data.leaflet_name,
          storeName: data.store,
          leafletId: data.id,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Gagal membuka data leaflet.");
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) {
      setHistoryData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const filteredData = historyData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.store.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Desain</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola dan edit kembali leaflet yang pernah Anda buat.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari desain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-200 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
            >
              <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 group-hover:text-indigo-200 transition-colors">
                    <FileText size={56} strokeWidth={1} />
                    <span className="text-xs font-medium mt-2">
                      Preview Tidak Tersedia
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-200 backdrop-blur-[1px]">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-white text-indigo-600 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2 hover:bg-indigo-50"
                  >
                    <Edit3 size={16} /> Lanjut Edit
                  </button>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm flex items-center gap-1.5 ${
                      item.status === "exported" || item.status === "Selesai" || item.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}
                  >
                    {item.status === "exported" || item.status === "Selesai" || item.status === "completed" ? (
                        <><CheckCircle2 size={12}/> SELESAI</>
                    ) : (
                        <><FileClock size={12}/> DRAFT</>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors" title={item.title}>
                    {item.title}
                  </h3>
                  <button className="text-slate-300 hover:text-slate-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-2 mb-6 mt-2">
                  <div className="flex items-center text-slate-500 text-xs font-medium">
                    <MapPinIcon size={14} className="mr-2 text-indigo-400" />
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.store}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs">
                    <Calendar size={14} className="mr-2 text-slate-400" />
                    <span>Terakhir diedit: {item.date}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs">
                    <FileText size={14} className="mr-2 text-slate-400" />
                    <span>Total {item.pageCount} Halaman</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    <Clock size={12} />
                    {item.status === "draft" || item.status === "Draft" ? "Belum didownload" : "Sudah didownload"}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Hapus Desain"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <FileText className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Belum ada riwayat
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
            Anda belum membuat leaflet apa pun. Mulai buat desain sekarang untuk
            melihat riwayat di sini.
          </p>
          <button
            onClick={() => navigate("/pilih-template")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-indigo-200"
          >
            Buat Leaflet Baru
          </button>
        </div>
      )}
    </div>
  );
};

const MapPinIcon = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default HistoryPage;