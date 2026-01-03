import { useState, useEffect } from "react";
import { Plus, Trash2, Layout, Loader2, X, Pencil } from "lucide-react";
import { LeafletService } from "../services/leafletService";

interface Template {
  id: number;
  title: string;
  image_path: string;
  type: string;
  is_default: boolean;
}

const PilihTemplatePage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setNewTitle("");
    setNewFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template) => {
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
    } catch (error) {
      alert("Gagal menyimpan template. Pastikan file sesuai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template ini?")) return;
    try {
      await LeafletService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      alert("Gagal menghapus template.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manajemen Template Desain
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Upload gambar layout kosong yang akan digunakan sebagai background
            leaflet.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm w-fit"
        >
          <Plus size={18} />
          Tambah Template
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
              className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                {template.image_path ? (
                  <img
                    src={`http://127.0.0.1:8000/storage/${template.image_path}`}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Layout size={48} />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => openEditModal(template)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform"
                    title="Edit Template"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform"
                    title="Hapus Template"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100">
                <h3
                  className="font-semibold text-slate-800 text-sm truncate"
                  title={template.title}
                >
                  {template.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {template.id}
                </p>
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
                  {editingTemplate ? "Update Template" : "Simpan Template"}
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
