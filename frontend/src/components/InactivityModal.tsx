import React from "react";

interface InactivityModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onLogout: () => void;
}

const InactivityModal: React.FC<InactivityModalProps> = ({
  isOpen,
  onContinue,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">
          Sesi Akan Berakhir
        </h2>
        <p className="text-slate-600 mb-6">
          Anda tidak melakukan aktivitas selama beberapa waktu. Apakah Anda
          ingin melanjutkan sesi?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-150 text-sm font-medium"
          >
            Tidak (Logout)
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors duration-150 text-sm font-medium"
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityModal;
