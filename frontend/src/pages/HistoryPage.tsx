import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LeafletService } from "../services/leafletService";
import {
  Search,
  Calendar,
  MoreVertical,
  Edit3,
  Trash2,
  Download,
  FileText,
  Clock,
  Filter,
} from "lucide-react";

interface HistoryItem {
  id: number;
  title: string;
  store: string;
  date: string;
  thumbnailUrl: string | null;
  status: "draft" | "exported";
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
      const leafletData = await LeafletService.getLeafletById(item.id);
      navigate("/editor", {
        state: {
          leafletData: leafletData,
          leafletName: item.title,
          leafletId: item.id,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Gagal membuka data leaflet.");
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
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
              className="h-64 bg-slate-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <FileText size={48} strokeWidth={1} />
                    <span className="text-xs font-medium mt-2">
                      Preview Halaman Depan
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-200">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-white text-indigo-600 px-4 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
                  >
                    <Edit3 size={16} /> Buka Editor
                  </button>
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      item.status === "exported"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}
                  >
                    {item.status === "exported" ? "Selesai" : "Draft"}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-slate-500 text-sm">
                    <MapPinIcon size={14} className="mr-2 text-slate-400" />
                    <span>{item.store}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Calendar size={14} className="mr-2 text-slate-400" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <FileText size={14} className="mr-2 text-slate-400" />
                    <span>{item.pageCount} Halaman</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={12} />
                    {item.status === "draft" ? "Auto-saved" : "Finalized"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="Download Ulang"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">
            Belum ada riwayat
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Anda belum membuat leaflet apa pun. Mulai buat desain sekarang untuk
            melihat riwayat di sini.
          </p>
          <button
            onClick={() => navigate("/buat-leaflet")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
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
