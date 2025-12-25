// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { uploadLeafletData } from "../services/leafletService";
// import {
//   UploadCloud,
//   FileSpreadsheet,
//   Loader2,
//   ArrowRight,
// } from "lucide-react";
// import { isAxiosError } from "axios";

// const BuatLeafletPage = () => {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const navigate = useNavigate();

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setSelectedFile(e.target.files[0]);
//       setError(null);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!selectedFile) {
//       setError("Harap unggah file Excel terlebih dahulu.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     const formData = new FormData();
//     formData.append("excel_file", selectedFile);

//     try {
//       const response = await uploadLeafletData(formData);
//       navigate("/pilih-template", {
//         state: {
//           uploadId: response.upload_id,
//           filename: selectedFile.name,
//         },
//       });
//     } catch (err) {
//       if (isAxiosError(err)) {
//         setError(err.response?.data?.message || "Gagal memproses file.");
//       } else {
//         setError("Terjadi kesalahan yang tidak terduga.");
//       }
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div>
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-6 sm:p-8 rounded-xl shadow-sm flex flex-col"
//         style={{ minHeight: "calc(100vh - 10rem)" }}
//       >
//         <h2 className="text-xl font-semibold text-slate-700 mb-4">
//           Langkah 1: Unggah File Excel
//         </h2>

//         <label
//           htmlFor="file-upload"
//           className="flex flex-col items-center justify-center w-full flex-grow border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
//         >
//           {!selectedFile ? (
//             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
//               <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
//               <p className="mb-2 text-sm text-slate-500">
//                 <span className="font-semibold">Klik untuk unggah</span> atau
//                 seret file
//               </p>
//               <p className="text-xs text-slate-400">XLSX, XLS (Maks. 5MB)</p>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
//               <FileSpreadsheet className="h-10 w-10 text-green-600 mb-3" />
//               <p className="font-semibold text-slate-800">
//                 {selectedFile.name}
//               </p>
//               <p className="text-sm text-slate-500">
//                 {(selectedFile.size / 1024).toFixed(2)} KB
//               </p>
//               <p className="text-xs text-blue-500 mt-2">
//                 Klik lagi untuk mengganti file
//               </p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept=".xlsx, .xls"
//             onChange={handleFileChange}
//           />
//         </label>

//         <div className="mt-auto pt-6">
//           {error && (
//             <div className="mb-4 text-center text-red-600 font-medium">
//               {error}
//             </div>
//           )}
//           <button
//             type="submit"
//             disabled={isLoading || !selectedFile}
//             className="w-full flex items-center justify-center gap-2 text-lg font-semibold py-3 px-6 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isLoading ? (
//               <Loader2 className="h-6 w-6 animate-spin" />
//             ) : (
//               <>
//                 Lanjutkan
//                 <ArrowRight className="h-5 w-5" />
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default BuatLeafletPage;

// ================================== DUMMY ===============================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { uploadLeafletData } from "../services/leafletService"; // Dimatikan sementara untuk Mode Dummy
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from "lucide-react";
// import { isAxiosError } from "axios";

const BuatLeafletPage = () => {
  const navigate = useNavigate();

  // State untuk File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk Alur Proses (Step 1 -> Step 2)
  const [step, setStep] = useState<1 | 2>(1);
  const [detectedRegions, setDetectedRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setStep(1); // Reset ke langkah 1 jika ganti file
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

    // --- SIMULASI PARSING BACKEND ---
    // Di backend nanti: Baca Excel -> Ambil unique value kolom 'STORE' -> Return array
    setTimeout(() => {
      setIsLoading(false);
      // Data pura-pura hasil parsing kolom STORE
      const mockStoreValues = [
        "BALI",
        "JABODETABEK",
        "NASIONAL",
        "SURABAYA",
        "MEDAN",
      ];
      setDetectedRegions(mockStoreValues);
      setSelectedRegion(mockStoreValues[0]); // Default pilih yang pertama
      setStep(2); // Pindah ke langkah pilih daerah
    }, 1500);
    // --------------------------------
  };

  const handleGenerateLeaflet = () => {
    // Masuk ke Editor dengan membawa state region yang dipilih
    console.log(`Generating leaflet for region: ${selectedRegion}`);
    navigate("/pilih-template");
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Header Halaman */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Buat Leaflet Baru</h1>
        <p className="text-slate-500">Otomatisasi desain dari data Excel</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        {/* STEP 1: UPLOAD FILE */}
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

          {/* Tombol Proses (Hanya muncul di Step 1) */}
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

        {/* STEP 2: PILIH REGION (Muncul setelah upload sukses) */}
        {step === 2 && (
          <div className="mt-8 pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                2
              </span>
              Pilih Wilayah (Store)
            </h2>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 flex gap-2">
                <MapPin size={18} />
                Sistem mendeteksi{" "}
                <strong>{detectedRegions.length} wilayah</strong> dari kolom
                STORE.
              </p>
            </div>

            <div className="space-y-6">
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
                onClick={handleGenerateLeaflet}
                className="w-full flex items-center justify-center gap-2 text-lg font-bold py-4 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-1"
              >
                Masuk ke Editor Visual
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
