import { useParams } from "react-router-dom";

const EditorPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Editor Visual</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <p className="text-slate-700">
          Anda sedang mengedit Leaflet dengan ID:{" "}
          <span className="font-semibold text-blue-600">{id}</span>
        </p>
        <p className="text-slate-500 mt-4">
          (Halaman editor visual akan dibangun di langkah berikutnya.)
        </p>
      </div>
    </div>
  );
};

export default EditorPage;
