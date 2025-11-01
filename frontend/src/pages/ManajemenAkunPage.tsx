import { useState, useEffect } from "react";
import type { User } from "../services/userService";
import {
  getUsers,
  deactivateUser,
  activateUser,
  addUser,
  resetSimulationData,
  adminResetUserPassword,
} from "../services/userService";
import { PlusCircle, RefreshCw, Pencil } from "lucide-react";
import AlertModal from "../components/AlertModal";
import AdminResetPasswordModal from "../components/AdminResetPasswordModal";

type AlertType = "success" | "error" | "confirm" | "info";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  children?: React.ReactNode;
  type: AlertType;
  onConfirm?: () => void;
}

const ManajemenAkunPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    role: "staff",
  });
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal mengambil data pengguna.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatusClick = (user: User) => {
    const action = user.status === "active" ? "menonaktifkan" : "mengaktifkan";
    setAlertState({
      isOpen: true,
      title: "Konfirmasi Tindakan",
      message: `Anda yakin ingin ${action} akun ${user.name}?`,
      type: "confirm",
      onConfirm: () => toggleUserStatus(user),
    });
  };

  const toggleUserStatus = async (user: User) => {
    const isActivating = user.status !== "active";
    const action = isActivating ? activateUser : deactivateUser;
    const successMessage = isActivating ? "diaktifkan" : "dinonaktifkan";
    try {
      await action(user.id);
      fetchUsers();
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message: `Akun berhasil ${successMessage}.`,
        type: "success",
      });
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: `Gagal mengubah status akun.`,
        type: "error",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await addUser(newUser);
      setIsModalOpen(false);
      fetchUsers();
      setNewUser({ name: "", email: "", username: "", role: "staff" });

      setAlertState({
        isOpen: true,
        title: "Sukses!",
        message: `Akun untuk ${response.user.name} berhasil dibuat.`,
        children: (
          <p className="text-gray-500">
            Informasi login lengkap telah disimulasikan terkirim ke{" "}
            <strong className="font-medium text-gray-800">
              {response.user.email}
            </strong>
            .
          </p>
        ),
        type: "success",
      });
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal menambah akun. Pastikan email & username unik.",
        type: "error",
      });
    }
  };

  const handleResetDataClick = () => {
    setAlertState({
      isOpen: true,
      title: "Konfirmasi Reset Data",
      message:
        "Ini akan menghapus SEMUA data produk, leaflet, dan template. Akun pengguna tidak akan dihapus. Lanjutkan?",
      type: "confirm",
      onConfirm: handleResetData,
    });
  };

  const handleResetData = async () => {
    try {
      const response = await resetSimulationData();
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message: response.message,
        type: "success",
      });
      fetchUsers();
      window.dispatchEvent(new CustomEvent("dataChanged"));
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal mereset data.",
        type: "error",
      });
    }
  };

  const handleOpenResetModal = (user: User) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setSelectedUser(null);
    setIsResetModalOpen(false);
  };

  const handlePasswordReset = async (password: string) => {
    if (!selectedUser) return;

    try {
      await adminResetUserPassword(selectedUser.id, password);
      handleCloseResetModal();
      setAlertState({
        isOpen: true,
        title: "Sukses",
        message: `Password untuk ${selectedUser.name} berhasil direset.`,
        type: "success",
      });
    } catch {
      setAlertState({
        isOpen: true,
        title: "Error",
        message: "Gagal mereset password.",
        type: "error",
      });
      throw new Error("Gagal mereset password");
    }
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Manajemen Akun
            </h1>
            <p className="text-sm text-slate-500">
              Kelola akun pengguna (khusus Manager).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDataClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Reset Data (Dev)</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors shadow"
            >
              <PlusCircle size={20} />
              <span>Tambah Akun</span>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="p-4 text-sm font-semibold text-slate-500">
                    Nama Staff
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-500">
                    Email
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-500">
                    Username
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="p-4 text-sm font-medium text-slate-800">
                        {user.name}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {user.email}
                      </td>
                      <td className="p-4 text-sm text-slate-500 font-mono">
                        {user.username}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            user.status === "active"
                              ? "text-green-800 bg-green-100"
                              : "text-red-800 bg-red-100"
                          }`}
                        >
                          {user.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 flex items-center space-x-4">
                        <button
                          onClick={() => handleToggleStatusClick(user)}
                          className={`text-sm font-medium ${
                            user.status === "active"
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {user.status === "active"
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => handleOpenResetModal(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Reset Password"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      Belum ada pengguna.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Tambah Akun Baru</h3>
            </div>
            <div className="p-6 space-y-4">
              <input
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
                placeholder="Nama Lengkap"
                className="w-full p-2 border rounded-md"
              />
              <input
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
                type="email"
                placeholder="Email"
                className="w-full p-2 border rounded-md"
                Next
              />
              <input
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                required
                placeholder="Username"
                className="w-full p-2 border rounded-md"
              />
              <select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <p className="text-xs text-slate-500">
                Password sementara akan di-generate oleh sistem dan
                disimulasikan terkirim ke email.
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-pastel-blue hover:bg-pastel-blue-dark text-slate-800 font-semibold"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      >
        {alertState.children}
      </AlertModal>

      <AdminResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={handleCloseResetModal}
        onSubmit={handlePasswordReset}
        userName={selectedUser?.name || ""}
      />
    </>
  );
};

export default ManajemenAkunPage;
