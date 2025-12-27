import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Layout, Loader2 } from "lucide-react";
// FIX: Import LeafletService (bukan generateLeafletLayout)
import { LeafletService } from "../services/leafletService";

const TEMPLATES = [
  {
    id: 1,
    name: "Grid Standar A4",
    desc: "3 Kolom x 4 Baris (12 Item/Halaman)",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    name: "Grid Padat A4",
    desc: "4 Kolom x 5 Baris (20 Item/Halaman)",
    color: "bg-green-100 text-green-600",
  },
  {
    id: 3,
    name: "Poster Promo A3",
    desc: "Highlight Produk Besar (6 Item/Halaman)",
    color: "bg-purple-100 text-purple-600",
  },
];

const PilihTemplatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil data file & storeName yang dikirim dari halaman sebelumnya (jika ada)
  // Note: Karena di BuatLeafletPage kita sudah redirect langsung ke editor,
  // halaman ini mungkin jarang diakses dengan state, tapi kita jaga-jaga.
  const { file, storeName } = location.state || {};

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLanjut = async () => {
    if (!selectedId) return;

    setIsLoading(true);
    try {
      if (file && storeName) {
        // Skenario 1: Data diteruskan dari Step 1
        const result = await LeafletService.generateDraft(
          file,
          selectedId,
          storeName
        );
        navigate("/editor", { state: { leafletData: result } });
      } else {
        // Skenario 2: Masuk tanpa data (Fallback / Dummy)
        // Ini berguna jika user akses langsung url /pilih-template
        navigate("/editor");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memproses template.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          Pilih Template Desain
        </h1>
        <p className="text-slate-500 mt-1">
          Sesuaikan tata letak produk dengan kebutuhan promosi Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedId(template.id)}
            className={`
              relative p-6 rounded-xl border-2 text-left transition-all duration-200 group
              ${
                selectedId === template.id
                  ? "border-blue-600 bg-blue-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
              }
            `}
          >
            {selectedId === template.id && (
              <div className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full animate-in zoom-in">
                <Check size={16} strokeWidth={3} />
              </div>
            )}

            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${template.color}`}
            >
              <Layout size={24} />
            </div>

            <h3 className="font-bold text-slate-800 mb-1">{template.name}</h3>
            <p className="text-sm text-slate-500">{template.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-200">
        <button
          onClick={handleLanjut}
          disabled={!selectedId || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-1 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Memproses...
            </>
          ) : (
            "Buat Leaflet Sekarang"
          )}
        </button>
      </div>
    </div>
  );
};

export default PilihTemplatePage;
