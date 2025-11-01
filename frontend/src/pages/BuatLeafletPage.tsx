import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadLeafletData } from "../services/leafletService";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { isAxiosError } from "axios";

const BuatLeafletPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Harap unggah file Excel terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("excel_file", selectedFile);

    try {
      const response = await uploadLeafletData(formData);
      navigate("/pilih-template", {
        state: {
          uploadId: response.upload_id,
          filename: selectedFile.name,
        },
      });
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Gagal memproses file.");
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-xl shadow-sm flex flex-col"
        style={{ minHeight: "calc(100vh - 10rem)" }}
      >
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Langkah 1: Unggah File Excel
        </h2>

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full flex-grow border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
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
              <FileSpreadsheet className="h-10 w-10 text-green-600 mb-3" />
              <p className="font-semibold text-slate-800">
                {selectedFile.name}
              </p>
              <p className="text-sm text-slate-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <p className="text-xs text-blue-500 mt-2">
                Klik lagi untuk mengganti file
              </p>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </label>

        <div className="mt-auto pt-6">
          {error && (
            <div className="mb-4 text-center text-red-600 font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className="w-full flex items-center justify-center gap-2 text-lg font-semibold py-3 px-6 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                Lanjutkan
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuatLeafletPage;
