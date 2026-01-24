import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Trash2, Layout, Loader2, X, Pencil, ArrowRight } from "lucide-react";
import { LeafletService } from "../services/leafletService";

interface Template {
  id: number;
  title: string;
  image_path: string;
  type: string;
  is_default: boolean;
}

const BACKEND_URL = "http://127.0.0.1:8000";

const PilihTemplatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { file, storeName, leafletName } = location.state || {};

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!file || !storeName) {
      navigate("/buat-leaflet");
      return;
    }
    fetchTemplates();
  }, [file, storeName, navigate]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await LeafletService.getTemplates();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = async (templateId: number) => {
    setIsProcessing(true);
    try {
        const selectedTemplate = templates.find(t => t.id === templateId);
        
        const templateUrl = selectedTemplate ? selectedTemplate.image_path : null;

        const draftResult = await LeafletService.generateDraft(file, storeName, leafletName);
        
        let targetData = null;
        
        if (storeName === 'ALL') {
            const firstRegion = Object.keys(draftResult)[0];
            if (firstRegion) targetData = draftResult[firstRegion];
        } else {
            targetData = draftResult[storeName];
        }

        if (!targetData) {
            throw new Error("Gagal mengambil data layout dari draft.");
        }

        navigate("/editor", {
            state: {
                leafletData: targetData, 
                leafletName: leafletName,
                storeName: storeName,
                templateUrl: templateUrl 
            }
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        alert(error.message || "Gagal memproses leaflet");
        setIsProcessing(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setNewTitle("");
    setNewFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setNewTitle(template.title);
    setNewFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    if (!editingTemplate && !newFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("type", "master");
    if (newFile) {
      formData.append("image", newFile);
    }

    try {
      if (editingTemplate) {
        await LeafletService.updateTemplate(editingTemplate.id, formData);
      } else {
        await LeafletService.uploadTemplate(formData);
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch {
      alert("Gagal menyimpan template. Pastikan file sesuai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus template ini?")) return;
    try {
      await LeafletService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Gagal menghapus template.");
    }
  };

  if (isProcessing) {
    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Sedang Memproses Layout...</h2>
            <p className="text-slate-500 mt-2">Menerapkan logika parsing dan positioning</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Pilih Template Desain
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Klik pada template untuk menerapkan data <strong>{storeName}</strong> ke dalam layout.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm w-fit"
        >
          <Plus size={18} />
          Upload Template Baru
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="animate-spin mr-2" /> Memuat data...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">
            Belum ada template. Silakan upload template baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-indigo-300 transition-all duration-200 flex flex-col cursor-pointer"
            >
              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                {template.image_path ? (
                  <img
                    src={`${BACKEND_URL}/api/media/${template.image_path}`}
                    onError={(e) => {
                         e.currentTarget.src = `${BACKEND_URL}/storage/${template.image_path}`;
                    }}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Layout size={48} />
                  </div>
                )}

                <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                    <span className="font-bold text-lg">Pilih Ini</span>
                    <ArrowRight size={24} />
                </div>

                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    onClick={(e) => openEditModal(template, e)}
                    className="bg-white/90 hover:bg-white text-blue-600 p-1.5 rounded-full shadow-sm"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    className="bg-white/90 hover:bg-white text-red-600 p-1.5 rounded-full shadow-sm"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm truncate">
                  {template.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
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
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Contoh: Layout Promo A4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingTemplate
                    ? "Ganti File Gambar (Opsional)"
                    : "File Gambar (PNG/JPG)"}
                </label>
                <input
                  type="file"
                  required={!editingTemplate}
                  accept="image/png, image/jpeg"
                  onChange={(e) =>
                    setNewFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center shadow-sm"
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  )}
                  {editingTemplate ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PilihTemplatePage;