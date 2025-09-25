import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/productService";
import { PlusCircle, Trash2 } from "lucide-react";
import AlertModal from "../components/AlertModal";

interface Product {
  id: number;
  plu_code: string;
  name: string;
  image_path: string;
}

interface AppContext {
  openProductModal: () => void;
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
    } catch (fetchError) {
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
    } catch (deleteError) {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal menghapus produk.",
        type: "error",
      });
    }
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Bank Gambar
            </h1>
            <p className="text-sm text-slate-500">
              Database terpusat untuk semua aset gambar produk.
            </p>
          </div>
          <button
            onClick={openProductModal}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-slate-800 bg-pastel-blue rounded-lg hover:bg-pastel-blue-dark hover:text-white transition-colors"
          >
            <PlusCircle size={20} />
            <span>Tambah Produk</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    Kode PLU Unit
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    Gambar
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    Nama Produk
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-200">
                      <td className="p-3 text-sm text-slate-600 font-mono">
                        {product.plu_code}
                      </td>
                      <td className="p-3">
                        <img
                          src={`http://127.0.0.1:8000/storage/${product.image_path}`}
                          alt={product.name}
                          className="h-12 w-12 object-contain rounded border p-1"
                        />
                      </td>
                      <td className="p-3 text-sm font-medium text-slate-700">
                        {product.name}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="p-2 rounded-md bg-pastel-red/50 hover:bg-pastel-red text-slate-800 transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Belum ada produk. Silakan tambahkan produk baru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
