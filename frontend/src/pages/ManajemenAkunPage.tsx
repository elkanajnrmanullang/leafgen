import { useState, useEffect } from 'react';

const ManajemenAkunPage = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800">Manajemen Akun</h1>
                    <p className="text-sm text-slate-500">Kelola akun pengguna (khusus Manager).</p>
                </div>
                <button className="modal-trigger flex items-center gap-2 px-4 py-2 font-semibold text-slate-800 bg-pastel-blue rounded-lg hover:bg-pastel-blue-dark hover:text-white transition-colors">
                    Tambah Akun
                </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-500">Nama Staff</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Email</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Username</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                             <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400">Data pengguna belum tersedia.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManajemenAkunPage;