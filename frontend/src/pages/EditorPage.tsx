import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DUMMY_RESPONSE, type LeafletItem } from "../data/dummyLeafletData";
import {
  ZoomIn,
  ZoomOut,
  Layers,
  MousePointer2,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Move,
  Grid,
  CheckCircle2,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Type,
} from "lucide-react";

interface LeafletPage {
  id: string;
  pageNumber: number;
  items: LeafletItem[];
}

const EditorPage = () => {
  const navigate = useNavigate();

  const [pages, setPages] = useState<LeafletPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.3);
  const [designName, setDesignName] = useState("Nama Desain");
  const [isGridEnabled, setIsGridEnabled] = useState(false);

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"PDF" | "JPG" | "PNG">(
    "PDF"
  );

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragActivePageId, setDragActivePageId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      const initialItems = DUMMY_RESPONSE.data as LeafletItem[];
      setPages([
        {
          id: "page-1",
          pageNumber: 1,
          items: initialItems,
        },
      ]);
      setSelectedPageId("page-1");
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddPage = () => {
    const newPageId = `page-${Date.now()}`;
    setPages((prev) => [
      ...prev,
      {
        id: newPageId,
        pageNumber: prev.length + 1,
        items: [],
      },
    ]);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    setPages((prev) => {
      const remaining = prev.filter((p) => p.id !== pageId);
      return remaining.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
  };

  const handleDuplicatePage = (pageId: string) => {
    const pageToClone = pages.find((p) => p.id === pageId);
    if (!pageToClone) return;

    const newPageId = `page-${Date.now()}`;
    const clonedItems = JSON.parse(JSON.stringify(pageToClone.items)).map(
      (item: LeafletItem) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })
    );

    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === pageId);
      const newPages = [...prev];
      newPages.splice(idx + 1, 0, {
        id: newPageId,
        pageNumber: 0,
        items: clonedItems,
      });
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const handleSidebarDragStart = (e: React.DragEvent, item: LeafletItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasDrop = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    const jsonData = e.dataTransfer.getData("application/json");

    if (!jsonData) return;

    const droppedItem = JSON.parse(jsonData) as LeafletItem;
    const currentCanvas = pageRefs.current[pageId];

    if (!currentCanvas) return;

    const canvasRect = currentCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;

    const newItem: LeafletItem = {
      ...droppedItem,
      id: `item-${Date.now()}`,
      layout: {
        x: mouseX - (droppedItem.layout?.w || 400) / 2,
        y: mouseY - (droppedItem.layout?.h || 400) / 2,
        w: droppedItem.layout?.w || 400,
        h: droppedItem.layout?.h || 400,
      },
    };

    setPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          return { ...p, items: [...p.items, newItem] };
        }
        return p;
      })
    );

    setSelectedItemId(newItem.id);
    setSelectedPageId(pageId);
  };

  const handleAddText = () => {
    const targetPageId = selectedPageId || pages[0].id;
    const newItem: LeafletItem = {
      id: `text-${Date.now()}`,
      plu: "",
      name: "Teks Baru",
      price_display: "Rp 0",
      show_coret: false,
      image_url: "",
      manual_upload_needed: false,
      components: {},
      layout: { x: 100, y: 100, w: 600, h: 200 },
    };

    setPages((prev) =>
      prev.map((p) =>
        p.id === targetPageId ? { ...p, items: [...p.items, newItem] } : p
      )
    );
    setSelectedItemId(newItem.id);
  };

  const handleAddImage = () => {
    const targetPageId = selectedPageId || pages[0].id;
    const newItem: LeafletItem = {
      id: `img-${Date.now()}`,
      plu: "",
      name: "Gambar Baru",
      price_display: "",
      show_coret: false,
      image_url: "https://placehold.co/400x400/png?text=Image",
      manual_upload_needed: false,
      components: {},
      layout: { x: 100, y: 100, w: 400, h: 400 },
    };

    setPages((prev) =>
      prev.map((p) =>
        p.id === targetPageId ? { ...p, items: [...p.items, newItem] } : p
      )
    );
    setSelectedItemId(newItem.id);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    item: LeafletItem,
    pageId: string
  ) => {
    e.stopPropagation();
    const currentCanvas = pageRefs.current[pageId];
    if (!item.layout || !currentCanvas) return;

    setSelectedItemId(item.id);
    setSelectedPageId(pageId);
    setDraggingId(item.id);
    setDragActivePageId(pageId);

    const canvasRect = currentCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;

    setDragOffset({
      x: mouseX - item.layout.x,
      y: mouseY - item.layout.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !dragActivePageId) return;

    const currentCanvas = pageRefs.current[dragActivePageId];
    if (!currentCanvas) return;

    e.preventDefault();

    const canvasRect = currentCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;

    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id !== dragActivePageId) return page;

        return {
          ...page,
          items: page.items.map((item) =>
            item.id === draggingId
              ? {
                  ...item,
                  layout: {
                    ...item.layout!,
                    x: mouseX - dragOffset.x,
                    y: mouseY - dragOffset.y,
                  },
                }
              : item
          ),
        };
      })
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setDragActivePageId(null);
  };

  const handleDeleteItem = () => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) =>
      prev.map((page) => {
        if (page.id === selectedPageId) {
          return {
            ...page,
            items: page.items.filter((i) => i.id !== selectedItemId),
          };
        }
        return page;
      })
    );
    setSelectedItemId(null);
  };

  const getSelectedItem = () => {
    if (!selectedPageId || !selectedItemId) return null;
    const page = pages.find((p) => p.id === selectedPageId);
    return page?.items.find((i) => i.id === selectedItemId);
  };

  const activeItem = getSelectedItem();

  const handleDownload = () => {
    console.log(`Downloading as ${selectedFormat}...`);
    setIsDownloadMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 h-screen w-screen overflow-hidden font-sans">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0 z-40">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/buat-leaflet")}
            className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
          >
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>

          <div className="flex flex-col">
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="text-lg font-semibold text-slate-800 outline-none hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded px-2 -ml-2 transition-all w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle2 size={14} />
              Status : Tersimpan
            </span>
          </div>

          <button
            onClick={() => setIsGridEnabled(!isGridEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isGridEnabled
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                isGridEnabled
                  ? "bg-blue-600 border-blue-600"
                  : "border-slate-400 bg-white"
              }`}
            >
              {isGridEnabled && (
                <CheckCircle2 size={12} className="text-white" />
              )}
            </div>
            <span>Grid Cerdas</span>
            <Grid
              size={16}
              className={isGridEnabled ? "text-blue-600" : "text-slate-400"}
            />
          </button>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-slate-200 transition-all transform active:scale-95"
            >
              Download
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isDownloadMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDownloadMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Jenis File
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFormat("PDF")}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group ${
                      selectedFormat === "PDF"
                        ? "bg-blue-50 border border-blue-100"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                        selectedFormat === "PDF"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${
                          selectedFormat === "PDF"
                            ? "text-blue-700"
                            : "text-slate-700"
                        }`}
                      >
                        PDF Standar
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Disarankan untuk Dokumen & Cetak
                      </span>
                    </div>
                    {selectedFormat === "PDF" && (
                      <CheckCircle2
                        size={16}
                        className="ml-auto text-blue-600"
                      />
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedFormat("JPG")}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group ${
                      selectedFormat === "JPG"
                        ? "bg-blue-50 border border-blue-100"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                        selectedFormat === "JPG"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      <ImageIcon size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${
                          selectedFormat === "JPG"
                            ? "text-blue-700"
                            : "text-slate-700"
                        }`}
                      >
                        JPG Image
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Ukuran file kecil, cocok untuk Web
                      </span>
                    </div>
                    {selectedFormat === "JPG" && (
                      <CheckCircle2
                        size={16}
                        className="ml-auto text-blue-600"
                      />
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedFormat("PNG")}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group ${
                      selectedFormat === "PNG"
                        ? "bg-blue-50 border border-blue-100"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                        selectedFormat === "PNG"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      <ImageIcon size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${
                          selectedFormat === "PNG"
                            ? "text-blue-700"
                            : "text-slate-700"
                        }`}
                      >
                        PNG Image
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Kualitas tinggi, latar transparan
                      </span>
                    </div>
                    {selectedFormat === "PNG" && (
                      <CheckCircle2
                        size={16}
                        className="ml-auto text-blue-600"
                      />
                    )}
                  </button>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Unduh {selectedFormat}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className="flex-1 flex overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-slate-500" />
              PANEL SAMPING
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Memuat aset...
              </div>
            ) : (
              DUMMY_RESPONSE.data.map((item) => (
                <div
                  key={`sidebar-${item.id}`}
                  draggable={true}
                  onDragStart={(e) =>
                    handleSidebarDragStart(e, item as LeafletItem)
                  }
                  className="flex gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing bg-white transition-all select-none group"
                >
                  <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 p-1 flex-shrink-0 group-hover:bg-blue-50/50 transition-colors">
                    <img
                      src={item.image_url}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-700 truncate mb-1">
                      {item.name}
                    </p>
                    <p className="text-xs font-mono text-blue-600 font-bold">
                      {item.price_display}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 relative flex flex-col min-w-0">
          <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 shadow-sm relative">
            <div className="flex gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  className="p-2 bg-white shadow-sm rounded-md text-blue-600"
                  title="Select"
                >
                  <MousePointer2 size={18} />
                </button>
                <button
                  className="p-2 hover:bg-slate-200 rounded-md text-slate-600"
                  title="Move Canvas"
                >
                  <Move size={18} />
                </button>
              </div>
              <div className="w-px h-8 bg-slate-300 mx-2 self-center"></div>
              <div className="flex gap-1">
                <button
                  onClick={handleAddImage}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-transparent hover:border-slate-200"
                  title="Add Image"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  onClick={handleAddText}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-transparent hover:border-slate-200"
                  title="Add Text"
                >
                  <Type size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200 shadow-sm">
                <button
                  onClick={() => setZoom((z) => Math.max(0.1, z - 0.05))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ZoomOut size={16} className="text-slate-600" />
                </button>
                <span className="text-xs font-mono font-bold w-12 text-center text-slate-700 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.5, z + 0.05))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ZoomIn size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex flex-col items-center py-10 px-8 gap-10 relative scroll-smooth bg-slate-100/50">
            {!loading &&
              pages.map((page) => (
                <div
                  key={page.id}
                  className="group relative flex flex-col gap-3"
                >
                  <div
                    className="flex items-center justify-between px-2 w-[calc(2480px*var(--zoom))] transition-all"
                    style={{ "--zoom": zoom } as React.CSSProperties}
                  >
                    <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded shadow-sm border border-slate-200">
                      Halaman {page.pageNumber}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDuplicatePage(page.id)}
                        className="p-2 bg-white hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 text-slate-500 transition-colors"
                        title="Duplikat"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="p-2 bg-white hover:text-red-600 rounded-lg shadow-sm border border-slate-200 text-slate-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={(el) => {
                      pageRefs.current[page.id] = el;
                    }}
                    className={`bg-white shadow-lg transition-all duration-200 ease-out origin-top relative overflow-hidden
                            ${
                              selectedPageId === page.id
                                ? "ring-4 ring-blue-500/20"
                                : ""
                            }
                        `}
                    onDragOver={handleCanvasDragOver}
                    onDrop={(e) => handleCanvasDrop(e, page.id)}
                    onClick={() => setSelectedPageId(page.id)}
                    style={{
                      width: "2480px",
                      height: "3508px",
                      transform: `scale(${zoom})`,
                      marginBottom: `calc(3508px * ${zoom} - 3508px)`,
                    }}
                  >
                    {isGridEnabled && (
                      <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 divide-x divide-y divide-blue-500/20 pointer-events-none z-50">
                        {[...Array(24)].map((_, i) => (
                          <div
                            key={i}
                            className="border border-blue-500/5"
                          ></div>
                        ))}
                      </div>
                    )}

                    {page.items.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={(e) => handleMouseDown(e, item, page.id)}
                        className={`
                                    absolute bg-white select-none group/item cursor-move
                                    ${
                                      selectedItemId === item.id
                                        ? "ring-4 ring-blue-500 z-40 shadow-2xl"
                                        : "hover:ring-2 hover:ring-blue-400 z-10"
                                    }
                                `}
                        style={{
                          left: item.layout?.x || 0,
                          top: item.layout?.y || 0,
                          width: item.layout?.w || 400,
                          height: item.layout?.h || 400,
                        }}
                      >
                        <div className="w-full h-full p-6 flex flex-col items-center border border-slate-100 pointer-events-none relative overflow-hidden bg-white">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              className="h-[55%] w-full object-contain mb-4 mix-blend-multiply"
                            />
                          )}
                          <h3 className="text-[48px] font-bold text-center leading-tight text-slate-900 line-clamp-2">
                            {item.name}
                          </h3>

                          <div className="mt-auto w-full text-center pb-2">
                            {item.show_coret && (
                              <div className="text-[36px] text-red-500 line-through font-bold decoration-4 decoration-red-500/60 mb-1">
                                {item.price_coret}
                              </div>
                            )}
                            <div className="text-[96px] font-black text-blue-700 tracking-tighter leading-none">
                              {item.price_display}
                            </div>
                          </div>

                          {item.components.badge_bbmu?.active && (
                            <div className="absolute top-0 right-0 bg-[#FFD700] text-red-900 text-xl font-black px-6 py-2 rounded-bl-3xl shadow-sm z-20 tracking-tight">
                              PALING MURAH
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      height: `calc(3508px * ${zoom})`,
                      display: "none",
                    }}
                  ></div>
                </div>
              ))}

            <div
              className="w-[calc(2480px*var(--zoom))] transition-all pb-20"
              style={{ "--zoom": zoom } as React.CSSProperties}
            >
              <button
                onClick={handleAddPage}
                className="group flex items-center justify-center gap-3 w-full py-8 bg-slate-200/50 hover:bg-slate-200 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl transition-all text-slate-500 hover:text-slate-700"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                  <Plus size={24} />
                </div>
                <span className="font-bold text-lg">Tambah Halaman</span>
              </button>
            </div>
          </div>
        </main>

        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <MousePointer2 size={16} className="text-slate-500" />
              PROPERTI
            </h3>
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-slate-50/30">
            {activeItem ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium flex items-center justify-between">
                  <span>
                    Halaman{" "}
                    {pages.find((p) => p.id === selectedPageId)?.pageNumber}
                  </span>
                  <span className="bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                    AKTIF
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 shadow-sm"
                    value={activeItem.name}
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Posisi X
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-600 bg-white shadow-sm"
                      value={Math.round(activeItem.layout?.x || 0)}
                      readOnly
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Posisi Y
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-600 bg-white shadow-sm"
                      value={Math.round(activeItem.layout?.y || 0)}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">
                    Tampilan Harga
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm font-medium text-slate-700">
                      Harga Coret
                    </span>
                    <div
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        activeItem.show_coret ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all transform ${
                          activeItem.show_coret ? "translate-x-5" : ""
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <button
                    onClick={handleDeleteItem}
                    className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors flex justify-center items-center gap-2 shadow-sm"
                  >
                    <Trash2 size={16} />
                    Hapus Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <MousePointer2 className="opacity-40" size={32} />
                </div>
                <p className="text-sm font-medium">Pilih elemen di canvas</p>
                <p className="text-xs opacity-60 mt-1">
                  untuk mengedit properti
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EditorPage;
