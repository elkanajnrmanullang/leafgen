import React, { useState, useEffect } from "react";
import { LeafletService } from "../services/leafletService";
import { Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import AlertModal from "../components/AlertModal";

interface Template {
  id: number;
  title: string;
  image_path: string;
  image_url?: string;
  type: string;
}

const ManajemenTemplatePage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "confirm" | "info";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await LeafletService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("image", newFile);
    formData.append("type", "master");

    try {
      await LeafletService.uploadTemplate(formData);
      setAlertState({
        isOpen: true,
        title: "Berhasil",
        message: "Template berhasil diupload",
        type: "success",
      });
      setShowUploadModal(false);
      setNewTitle("");
      setNewFile(null);
      fetchTemplates();
    } catch (error) {
      setAlertState({
        isOpen: true,
        title: "Gagal",
        message: "Gagal mengupload template",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setAlertState({
      isOpen: true,
      title: "Hapus Template",
      message: "Yakin ingin menghapus template ini?",
      type: "confirm",
      onConfirm: async () => {
        try {
          await LeafletService.deleteTemplate(id);
          fetchTemplates();
          setAlertState({
            isOpen: true,
            title: "Berhasil",
            message: "Template dihapus",
            type: "success",
          });
        } catch (error) {
          setAlertState({
            isOpen: true,
            title: "Gagal",
            message: "Gagal menghapus template",
            type: "error",
          });
        }
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Manajemen Template
          </h1>
          <p className="text-sm text-slate-500">
            Upload dan kelola background desain leaflet
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"
        >
          <Plus size={18} /> Upload Template
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">
            Memuat template...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            Belum ada template. Silakan upload template baru.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative"
              >
                <div className="relative aspect-[1/1.414] bg-slate-100 overflow-hidden">
                  <img
                    src={tpl.image_url} 
                    alt={tpl.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button
                    onClick={() => handleDeleteClick(tpl.id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Hapus Template"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3 border-t border-slate-100">
                  <h3 className="font-bold text-slate-700 text-sm truncate" title={tpl.title}>
                    {tpl.title}
                  </h3>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">
                    {tpl.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Upload Template Baru
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Contoh: Cover Promo Lebaran"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  File Gambar (Max 20MB)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    required
                  />
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-sm text-slate-600 font-medium px-2 truncate max-w-full">
                    {newFile ? newFile.name : "Klik untuk pilih gambar"}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Format: JPG, PNG
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isUploading && <Loader2 size={16} className="animate-spin" />}
                  {isUploading ? "Mengupload..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
};

export default ManajemenTemplatePage;