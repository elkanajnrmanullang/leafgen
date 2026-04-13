import React, { useState, useEffect, useRef } from "react";
import { LeafletService } from "../services/leafletService";
import { Plus, Trash2, Image as ImageIcon, Loader2, Edit } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch {
      console.error("Gagal memuat template");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setTitle("");
    setFile(null);
    setPreview(null);
    setEditingTemplate(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenModal = (template?: Template) => {
    resetForm();
    if (template) {
      setEditingTemplate(template);
      setTitle(template.title);
      setPreview(template.image_url || null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (!editingTemplate && !file) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    if (file) {
      formData.append("image", file);
    }
    formData.append("type", "master");

    try {
      if (editingTemplate) {
        await LeafletService.updateTemplate(editingTemplate.id, formData);
        setAlertState({
          isOpen: true,
          title: "Berhasil",
          message: "Template berhasil diperbarui",
          type: "success",
        });
      } else {
        await LeafletService.uploadTemplate(formData);
        setAlertState({
          isOpen: true,
          title: "Berhasil",
          message: "Template berhasil diupload",
          type: "success",
        });
      }
      handleCloseModal();
      fetchTemplates();
    } catch { // Menghapus (error)
      setAlertState({
        isOpen: true,
        title: "Gagal",
        message: "Gagal menyimpan template",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
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
        } catch { // Menghapus (error)
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
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"
        >
          <Plus size={18} /> Upload Template
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenModal(tpl)}
                      className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-all shadow-lg transform hover:scale-110"
                      title="Edit Template"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tpl.id)}
                      className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-all shadow-lg transform hover:scale-110"
                      title="Hapus Template"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editingTemplate ? "Edit Template" : "Upload Template Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Contoh: Cover Promo Lebaran"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  File Gambar {editingTemplate ? "(Opsional)" : "(Wajib)"}
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-all h-48 overflow-hidden
                    ${preview ? 'border-blue-300 bg-slate-50' : 'border-slate-300 hover:bg-slate-50'}
                  `}
                >
                  {preview ? (
                    <>
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="h-full w-full object-contain absolute inset-0 p-2" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold flex items-center gap-1">
                                <ImageIcon size={14} /> Ganti Gambar
                            </span>
                        </div>
                    </>
                  ) : (
                    <>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <ImageIcon size={24} />
                        </div>
                        <span className="text-sm text-slate-600 font-medium px-2">
                            Klik untuk pilih gambar
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                            Max 20MB (JPG/PNG)
                        </span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required={!editingTemplate}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
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