import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { generateLeafletLayout } from "../services/leafletService";
import { CheckCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";

const mockTemplates = [
  { id: 1, name: "Template Promo Merah", img: "/images/template1.jpg" },
  { id: 2, name: "Template Promo Biru", img: "/images/template2.jpg" },
];

const PilihTemplatePage = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    mockTemplates[0]?.id || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const uploadId = location.state?.uploadId;
  const filename = location.state?.filename;

  if (!uploadId || !filename) {
    return <Navigate to="/buat-leaflet" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      setError("Harap pilih template.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await generateLeafletLayout(
        uploadId,
        selectedTemplateId
      );
      navigate(`/editor/${response.leaflet_id}`);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Gagal membuat leaflet.");
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            File Terupload
          </h2>
          <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4">
            <FileSpreadsheet className="h-6 w-6 text-green-700" />
            <p className="font-semibold text-green-800">{filename}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Langkah 2: Pilih Template Latar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={`rounded-lg border-2 overflow-hidden cursor-pointer relative transition-all ${
                  selectedTemplateId === template.id
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : "border-slate-200 hover:border-blue-400"
                }`}
              >
                {selectedTemplateId === template.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
                <img
                  src={template.img}
                  alt={template.name}
                  className="h-40 w-full object-cover bg-slate-100"
                />
                <p className="text-center text-sm font-medium text-slate-600 p-2">
                  {template.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {error && (
            <div className="mb-4 text-center text-red-600 font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !selectedTemplateId}
            className="w-full flex items-center justify-center gap-2 text-lg font-semibold py-3 px-6 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "Generate Leaflet"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PilihTemplatePage;
