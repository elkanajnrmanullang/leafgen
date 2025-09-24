import { useState, useEffect } from 'react';

const BankGambarPage = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Bank Gambar</h1>
                <p className="text-sm text-slate-500">Database terpusat untuk semua aset gambar produk.</p>
              </div>
              <button className="modal-trigger flex items-center gap-2 px-4 py-2 font-semibold text-slate-800 bg-pastel-blue rounded-lg hover:bg-pastel-blue-dark hover:text-white transition-colors">
                Tambah Produk
              </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-500">Kode PLU Unit</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Gambar</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Nama Produk</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-slate-400">Data produk belum tersedia.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BankGambarPage;