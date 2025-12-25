import { useState, useEffect, useRef } from "react";
import { X, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import { addProduct, updateProduct } from "../services/productService";
import { isAxiosError } from "axios";

interface Product {
  id: number;
  plu_code: string;
  name: string;
  image_path: string;
}

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product;
}

const ProductUploadModal = ({
  isOpen,
  onClose,
  productToEdit,
}: ProductUploadModalProps) => {
  const [plu, setPlu] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setPlu(productToEdit.plu_code);
        setName(productToEdit.name);
        setPreview(`http://127.0.0.1:8000/storage/${productToEdit.image_path}`);
        setFile(null);
      } else {
        setPlu("");
        setName("");
        setFile(null);
        setPreview(null);
      }
      setError(null);
    }
  }, [isOpen, productToEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("plu_code", plu);
    formData.append("name", name);

    if (file) {
      formData.append("image_file", file);
    }

    try {
      if (productToEdit) {
        formData.append("_method", "PUT");
        await updateProduct(productToEdit.id, formData);
      } else {
        await addProduct(formData);
      }

      window.dispatchEvent(new Event("productAdded"));
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Gagal menyimpan produk.");
      } else {
        setError("Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {productToEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Gambar Produk
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                    border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all relative overflow-hidden group
                    ${
                      preview
                        ? "border-blue-300 bg-slate-50"
                        : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"
                    }
                `}
              style={{ height: "200px" }}
            >
              {preview ? (
                <img
                  src={preview}
                  className="w-full h-full object-contain mx-auto"
                  alt="Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="p-3 bg-slate-100 rounded-full mb-2 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <UploadCloud size={24} />
                  </div>
                  <span className="text-sm font-medium">Klik untuk upload</span>
                  <span className="text-xs">PNG, JPG (Max 2MB)</span>
                </div>
              )}

              {preview && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    <ImageIcon size={16} /> Ganti Gambar
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Kode PLU
              </label>
              <input
                type="text"
                required
                value={plu}
                onChange={(e) => setPlu(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                placeholder="Contoh: 100456"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Nama Produk
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Contoh: Minyak Goreng 2L"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : productToEdit ? (
              "Simpan Perubahan"
            ) : (
              "Upload Produk"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductUploadModal;
