import { CheckCircle, AlertTriangle, Info } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "confirm" | "info";
}

const AlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
}: AlertModalProps) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-600" />,
    error: <AlertTriangle className="h-6 w-6 text-red-600" />,
    confirm: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    info: <Info className="h-6 w-6 text-blue-600" />,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
              {icons[type]}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl">
          {type === "confirm" && onConfirm && (
            <button
              type="button"
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="inline-flex w-full justify-center rounded-md bg-pastel-red px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-pastel-red-dark sm:ml-3 sm:w-auto"
            >
              Ya, Lanjutkan
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          >
            {type === "confirm" ? "Batal" : "Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
