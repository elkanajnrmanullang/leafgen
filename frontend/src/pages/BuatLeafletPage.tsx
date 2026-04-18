import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LeafletService } from "../services/leafletService";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  ArrowRight,
  MapPin,
  CheckCircle2,
  FileText,
} from "lucide-react";

const BuatLeafletPage = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [detectedRegions, setDetectedRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [leafletName, setLeafletName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setStep(1);

      const defaultName = `Leaflet ${
        e.target.files[0].name.split(".")[0]
      } - ${new Date().toLocaleDateString("id-ID")}`;
      setLeafletName(defaultName);
    }
  };

  const handleUploadAndParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Harap unggah file Excel terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const regions = await LeafletService.uploadAndGetRegions(selectedFile);

      if (!regions || regions.length === 0) {
        setDetectedRegions(["ALL", "JAWA", "SUM", "KAL", "SUL", "AMB", "BLI"]);
        setSelectedRegion("ALL");
      } else {
        const regionsWithAll = Array.from(new Set(["ALL", ...regions]));
        setDetectedRegions(regionsWithAll);
        setSelectedRegion("ALL"); 
      }
      setStep(2);
    } catch (err: unknown) {
      console.error(err);
      setDetectedRegions(["ALL", "JAWA", "SUM", "KAL", "SUL", "AMB", "BLI"]);
      setSelectedRegion("ALL");
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!selectedFile || !selectedRegion) return;

    navigate("/pilih-template", {
      state: {
        file: selectedFile,
        storeName: selectedRegion,
        leafletName: leafletName,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Buat Leaflet Baru</h1>
        <p className="text-slate-500">Otomatisasi desain dari data Excel</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleUploadAndParse} className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                1
              </span>
              Unggah Data Excel
            </h2>
            {step === 2 && (
              <CheckCircle2 className="text-green-500" size={20} />
            )}
          </div>

          <label
            htmlFor="file-upload"
            className={`
                    flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${
                      step === 2
                        ? "bg-green-50 border-green-200 cursor-default"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400"
                    }
                `}
          >
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold">Klik untuk unggah</span> atau
                  seret file
                </p>
                <p className="text-xs text-slate-400">XLSX, XLS (Maks. 5MB)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <FileSpreadsheet
                  className={`h-10 w-10 mb-3 ${
                    step === 2 ? "text-green-600" : "text-blue-600"
                  }`}
                />
                <p className="font-semibold text-slate-800">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-slate-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                {step === 1 && (
                  <p className="text-xs text-blue-500 mt-2 hover:underline">
                    Klik untuk ganti file
                  </p>
                )}
              </div>
            )}

            {step === 1 && (
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
            )}
          </label>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 text-lg font-semibold py-3 px-6 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Sedang Membaca
                    File...
                  </>
                ) : (
                  <>
                    Proses File <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {step === 2 && (
          <div className="mt-8 pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                2
              </span>
              Detail & Wilayah
            </h2>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 flex gap-2">
                <MapPin size={18} />
                Sistem mendeteksi{" "}
                <strong>{detectedRegions.length - 1} opsi wilayah</strong> (Plus ALL).
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Promosi (Untuk Riwayat)
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={leafletName}
                    onChange={(e) => setLeafletName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    placeholder="Contoh: Promo JSM Bali"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wilayah Promosi
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                >
                  {detectedRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextStep}
                disabled={!leafletName.trim()}
                className="w-full flex items-center justify-center gap-2 text-lg font-bold py-4 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Pilih Template Desain
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuatLeafletPage;