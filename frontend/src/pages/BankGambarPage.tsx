import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/productService";
import {
  PlusCircle,
  Trash2,
  Search,
  Image as ImageIcon,
  Edit,
} from "lucide-react";
import AlertModal from "../components/AlertModal";

interface Product {
  id: number;
  plu_code: string;
  name: string;
  image_path: string;
}

interface AppContext {
  openProductModal: (product?: Product) => void;
}

type AlertType = "success" | "error" | "confirm" | "info";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  onConfirm?: () => void;
}

const BankGambarPage = () => {
  const { openProductModal } = useOutletContext<AppContext>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal mengambil data produk.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleProductAdded = () => fetchProducts();
    window.addEventListener("productAdded", handleProductAdded);
    fetchProducts();
    return () => {
      window.removeEventListener("productAdded", handleProductAdded);
    };
  }, []);

  const handleEditClick = (product: Product) => {
    openProductModal(product);
  };

  const handleDeleteClick = (productId: number) => {
    setAlertState({
      isOpen: true,
      title: "Konfirmasi Hapus",
      message: "Anda yakin ingin menghapus produk ini secara permanen?",
      type: "confirm",
      onConfirm: () => handleDeleteProduct(productId),
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await deleteProduct(productId);
      fetchProducts();
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message: "Produk berhasil dihapus.",
        type: "success",
      });
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal menghapus produk.",
        type: "error",
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.plu_code.includes(searchTerm)
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bank Gambar</h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola repositori aset visual produk Anda.
            </p>
          </div>
          <button
            onClick={() => openProductModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <PlusCircle size={20} />
            <span>Tambah Produk</span>
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama Produk atau PLU..."
            className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-slate-50 min-h-[400px] rounded-xl border border-slate-200 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p>Memuat aset gambar...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative"
                >
                  <div className="aspect-square p-4 flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors relative">
                    <img
                      src={`http://127.0.0.1:8000/storage/${product.image_path}`}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110 duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.classList.add(
                          "flex",
                          "items-center",
                          "justify-center"
                        );
                        const icon = document.createElement("div");
                        icon.innerHTML =
                          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        e.currentTarget.parentElement?.appendChild(icon);
                      }}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 hover:scale-110 transition-all shadow-lg"
                        title="Edit Produk"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 hover:scale-110 transition-all shadow-lg"
                        title="Hapus Gambar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-100">
                    <h3
                      className="font-bold text-slate-700 text-sm truncate"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {product.plu_code}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <ImageIcon size={48} className="text-slate-200" />
              </div>
              <p className="font-medium text-slate-600">
                Belum ada gambar ditemukan
              </p>
              <p className="text-sm mt-1">
                Coba kata kunci lain atau upload produk baru.
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </>
  );
};

export default BankGambarPage;