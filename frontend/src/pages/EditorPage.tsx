import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LeafletService } from "../services/leafletService";
import ProductUploadModal from "../components/ProductUploadModal"; 
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
  Loader2,
  Download,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import type {
  LeafletPage,
  EditorItem,
  BackendPage,
  BackendItem,
} from "../types";

interface Product {
  id: number;
  plu_code: string;
  name: string;
  image_path: string;
}

const processAssetUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith('http')) return url;
  if (!url.startsWith('/') && !url.startsWith('assets') && !url.startsWith('storage')) return `/assets/${url}`;
  if (!url.startsWith('/')) return `/${url}`;
  return url;
};

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [pages, setPages] = useState<LeafletPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.25);
  const [designName, setDesignName] = useState("Draft Otomatis");
  const [storeName, setStoreName] = useState("");
  const [isGridEnabled, setIsGridEnabled] = useState(false);
  const [leafletId, setLeafletId] = useState<string | undefined>(undefined);
  const [pageBackground, setPageBackground] = useState<string | null>(null);

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [selectedFormat, setSelectedFormat] = useState<"PDF" | "JPG" | "PNG">("PDF");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragActivePageId, setDragActivePageId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [generatedBadges, setGeneratedBadges] = useState<Record<string, string>>({});
  const [generatingBadges, setGeneratingBadges] = useState<Record<string, boolean>>({});

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);

  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const saveData = useCallback(
    async (status: "draft" | "exported") => {
      if (pages.length === 0) return;
      setSaveStatus("saving");
      try {
        const response = await LeafletService.saveLeaflet({
          id: leafletId,
          title: designName,
          store: storeName,
          pages: pages,
          status: status,
        });
        if (response && response.id) setLeafletId(response.id);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save failed", error);
        setSaveStatus("unsaved");
      }
    },
    [designName, storeName, pages, leafletId]
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backendData = location.state?.leafletData as any;
    const initialName = location.state?.leafletName;
    const storeFromNav = location.state?.storeName;
    const templateUrl = location.state?.templateUrl;

    if (templateUrl) setPageBackground(processAssetUrl(templateUrl));

    if (backendData) {
      let dataToUse = backendData;
      if (!backendData.pages) {
          const keys = Object.keys(backendData);
          if (keys.length > 0 && backendData[keys[0]]?.pages) {
              dataToUse = backendData[keys[0]];
          }
      }

      if (dataToUse && dataToUse.pages) {
        setDesignName(initialName || dataToUse.leaflet_name || "New Leaflet");
        setStoreName(storeFromNav || dataToUse.store || "Region");
        if (dataToUse.id) setLeafletId(dataToUse.id);

        const mappedPages: LeafletPage[] = dataToUse.pages.map(
            (page: BackendPage) => ({
            id: page.id || `page-${page.page_number}`,
            pageNumber: page.page_number,
            items: (page.items || []).map((item: BackendItem) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const raw = (item as any).data || (item as any).content || {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const componentName = (item as any).component_name || "card_cover_master";
                
                return {
                    id: item.id,
                    plu: item.plu,
                    type: item.type,
                    component_name: componentName,
                    content: {
                        ...raw,
                        name: raw.txt_name || raw.name || "Nama Barang",
                        price_display: raw.txt_price || raw.price_display || "",
                        image_url: processAssetUrl(raw.img_product || raw.image_url || "placeholder.png"),
                    },
                    needs_manual_image: item.needs_manual_image,
                    layout: {
                        x: Number(item.x) || 0,
                        y: Number(item.y) || 0,
                        w: Number(item.w) || 200,
                        h: Number(item.h) || 300,
                    },
                } as EditorItem;
            }),
            })
        );
        setPages(mappedPages);
        if (mappedPages.length > 0) setSelectedPageId(mappedPages[0].id);
      } else {
        setPages([{ id: "page-1", pageNumber: 1, items: [] }]);
      }
      setLoading(false);
    } else {
      setPages([{ id: "page-1", pageNumber: 1, items: [] }]);
      setLoading(false);
    }
  }, [location.state]);

  const generateBadgeForItem = useCallback(async (item: EditorItem) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemAny = item as any;
      const compName = itemAny.component_name || "card_cover_master";

      if (!item.content) return;

      setGeneratingBadges(prev => ({...prev, [item.id]: true}));
      
      try {
          const apiData = {
              ...item.content,
              txt_name: item.content.name,
              txt_price: item.content.price_display,
              img_product: item.content.image_url
          };

          const url = await LeafletService.generateBadge(
              compName,
              apiData
          );
          
          const fullUrl = processAssetUrl(url);
          setGeneratedBadges(prev => ({...prev, [item.id]: fullUrl}));
      } catch (e) {
          console.error("Failed to generate badge for item", item.id, e);
      } finally {
          setGeneratingBadges(prev => {
              const newState = {...prev};
              delete newState[item.id];
              return newState;
          });
      }
  }, []);

  useEffect(() => {
      pages.forEach(page => {
          page.items.forEach(item => {
              if (item.type === 'product_card' && !generatedBadges[item.id] && !generatingBadges[item.id]) {
                  generateBadgeForItem(item);
              }
          });
      });
  }, [pages, generatedBadges, generatingBadges, generateBadgeForItem]);

  useEffect(() => {
    if (loading) return;
    setSaveStatus("unsaved");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => saveData("draft"), 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [pages, designName, loading, saveData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToItem = (item: EditorItem, pageId: string) => {
    setSelectedItemId(item.id);
    setSelectedPageId(pageId);

    const pageElement = pageRefs.current[pageId];
    if (pageElement && mainContainerRef.current) {
        const pageRect = pageElement.getBoundingClientRect();
        const containerRect = mainContainerRef.current.getBoundingClientRect();
        const relativeY = (item.layout.y * zoom);
        const newScrollTop = mainContainerRef.current.scrollTop + (pageRect.top - containerRect.top) + relativeY - 100;

        mainContainerRef.current.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
        });
    }
  };

  const handleDownload = async () => {
    setIsDownloadMenuOpen(false);
    setIsDownloading(true);
    const originalZoom = zoom;
    setZoom(1);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      if (selectedFormat === "PDF") {
        const doc = new jsPDF("p", "mm", "a4");
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const element = pageRefs.current[page.id];
          if (element) {
            if (i > 0) doc.addPage();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false } as any);
            const imgData = canvas.toDataURL("image/jpeg", 0.9);
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            doc.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
          }
        }
        doc.save(`${designName}.pdf`);
      } else {
        const targetPageId = selectedPageId || pages[0].id;
        const element = pageRefs.current[targetPageId];
        if (element) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false } as any);
          const link = document.createElement("a");
          link.download = `${designName}-Page.${selectedFormat.toLowerCase()}`;
          link.href = canvas.toDataURL(`image/${selectedFormat.toLowerCase()}`, 0.9);
          link.click();
        }
      }
      await saveData("exported");
      navigate("/history");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Gagal mengunduh dokumen. Cek console untuk detail.");
    } finally {
      setZoom(originalZoom);
      setIsDownloading(false);
    }
  };

  const handleAddPage = () => {
    const newPageId = `page-${Date.now()}`;
    setPages((prev) => [...prev, { id: newPageId, pageNumber: prev.length + 1, items: [] }]);
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
      (item: EditorItem) => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })
    );
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === pageId);
      const newPages = [...prev];
      newPages.splice(idx + 1, 0, { id: newPageId, pageNumber: 0, items: clonedItems });
      return newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const handleSidebarDragStart = (e: React.DragEvent, item: EditorItem) => {
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
    const droppedItem = JSON.parse(jsonData) as EditorItem;
    const currentCanvas = pageRefs.current[pageId];
    if (!currentCanvas) return;
    const canvasRect = currentCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;
    const newItem: EditorItem = {
      ...droppedItem,
      id: `item-${Date.now()}`,
      layout: {
        x: mouseX - (droppedItem.layout.w || 400) / 2,
        y: mouseY - (droppedItem.layout.h || 400) / 2,
        w: droppedItem.layout.w || 400,
        h: droppedItem.layout.h || 400,
      },
    };
    setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, items: [...p.items, newItem] } : p));
    setSelectedItemId(newItem.id);
    setSelectedPageId(pageId);
    setGeneratedBadges(prev => ({...prev, [newItem.id]: generatedBadges[droppedItem.id] || ""}));
  };

  const handleAddText = () => {
    const targetPageId = selectedPageId || pages[0].id;
    const newItem: EditorItem = {
      id: `text-${Date.now()}`,
      plu: "",
      type: "text",
      content: { name: "Teks Baru", price_display: "Rp 0", price_original: 0, show_coret: false, image_url: "", is_bbmu: false, badge_spi_url: null },
      needs_manual_image: false,
      layout: { x: 100, y: 100, w: 600, h: 200 },
    };
    setPages((prev) => prev.map((p) => p.id === targetPageId ? { ...p, items: [...p.items, newItem] } : p));
    setSelectedItemId(newItem.id);
  };

  const handleAddImage = () => {
    const targetPageId = selectedPageId || pages[0].id;
    const newItem: EditorItem = {
      id: `img-${Date.now()}`,
      plu: "",
      type: "image",
      content: { name: "Gambar Baru", price_display: "", price_original: 0, show_coret: false, image_url: "/assets/placeholder.png", is_bbmu: false, badge_spi_url: null },
      needs_manual_image: false,
      layout: { x: 100, y: 100, w: 400, h: 400 },
    };
    setPages((prev) => prev.map((p) => p.id === targetPageId ? { ...p, items: [...p.items, newItem] } : p));
    setSelectedItemId(newItem.id);
  };

  const handleMouseDown = (e: React.MouseEvent, item: EditorItem, pageId: string) => {
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
    setDragOffset({ x: mouseX - item.layout.x, y: mouseY - item.layout.y });
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
      prevPages.map((page: LeafletPage) => {
        if (page.id !== dragActivePageId) return page;
        return {
          ...page,
          items: page.items.map((item: EditorItem) =>
            item.id === draggingId
              ? { ...item, layout: { ...item.layout, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y } }
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
      prev.map((page: LeafletPage) =>
        page.id === selectedPageId
          ? { ...page, items: page.items.filter((i: EditorItem) => i.id !== selectedItemId) }
          : page
      )
    );
    setSelectedItemId(null);
  };

  const toggleItemProperty = (key: string) => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) =>
        prev.map((page) => {
            if (page.id !== selectedPageId) return page;
            const updatedItems = page.items.map((item) => {
                if (item.id !== selectedItemId) return item;
                if (!item.content) return item;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return { ...item, content: { ...item.content, [key]: !(item.content as any)[key] } };
            });
            return { ...page, items: updatedItems as EditorItem[] };
        })
    );
  };

  const updateItemContent = (key: string, value: string | number | boolean | null) => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) =>
        prev.map((page) => {
            if (page.id !== selectedPageId) return page;
            const updatedItems = page.items.map((item) => {
                if (item.id !== selectedItemId) return item;
                if (!item.content) return item;
                return { ...item, content: { ...item.content, [key]: value } };
            });
            return { ...page, items: updatedItems as EditorItem[] };
        })
    );
  };

  const handleOpenBankGambar = () => {
     if (!selectedItemId || !selectedPageId) return;
     
     const item = getSelectedItem();
     if(item) {
         setProductToEdit({
             id: 0, 
             plu_code: item.plu || "",
             name: item.content?.name || "",
             image_path: "" 
         } as Product);
     } else {
         setProductToEdit(undefined);
     }
     setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
      setIsProductModalOpen(false);
      setProductToEdit(undefined);
      const item = getSelectedItem();
      if (item) refreshBadge(item);
  };

  const refreshBadge = (item: EditorItem) => {
      setGeneratedBadges(prev => {
          const newState = {...prev};
          delete newState[item.id];
          return newState;
      });
      generateBadgeForItem(item);
  };

  const getSelectedItem = () => {
    if (!selectedPageId || !selectedItemId) return null;
    return pages.find((p) => p.id === selectedPageId)?.items.find((i) => i.id === selectedItemId);
  };

  const activeItem = getSelectedItem();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 h-screen w-screen overflow-hidden font-sans">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/pilih-template")} className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 rounded-full text-slate-700 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <input type="text" value={designName} onChange={(e) => setDesignName(e.target.value)} className="text-lg font-semibold text-slate-800 outline-none hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded px-2 -ml-2 transition-all w-80" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-1 items-center bg-slate-100 p-1 rounded-lg">
             <button className="p-2 bg-white shadow-sm rounded-md text-blue-600 hover:text-blue-700" title="Select"><MousePointer2 size={18} /></button>
             <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm hover:rounded-md transition-all" title="Move Canvas"><Move size={18} /></button>
             <div className="w-px h-5 bg-slate-300 mx-1"></div>
             <button onClick={handleAddImage} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm hover:rounded-md transition-all" title="Add Image"><ImageIcon size={18} /></button>
             <button onClick={handleAddText} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm hover:rounded-md transition-all" title="Add Text"><Type size={18} /></button>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-green-600 flex items-center gap-1 font-medium"><CheckCircle2 size={12} /> Saved</span>}
            {saveStatus === "unsaved" && <span className="text-xs text-amber-500 flex items-center gap-1 font-medium">Unsaved</span>}
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200 shadow-sm">
            <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.05))} className="p-1 hover:bg-slate-100 rounded"><ZoomOut size={16} className="text-slate-600" /></button>
            <span className="text-xs font-mono font-bold w-12 text-center text-slate-700 select-none">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.05))} className="p-1 hover:bg-slate-100 rounded"><ZoomIn size={16} className="text-slate-600" /></button>
          </div>
          <button
            onClick={() => setIsGridEnabled(!isGridEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isGridEnabled ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Grid size={16} /> Grid
          </button>
          <div className="relative" ref={downloadMenuRef}>
            <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} disabled={isDownloading} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-slate-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
              {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {isDownloading ? "Memproses..." : "Download"}
              <ChevronDown size={16} className={`transition-transform ${isDownloadMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {isDownloadMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="space-y-1">
                  {(["PDF", "JPG", "PNG"] as const).map((fmt) => (
                    <button key={fmt} onClick={() => setSelectedFormat(fmt)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${selectedFormat === fmt ? "bg-blue-50 border border-blue-100" : "hover:bg-slate-50 border border-transparent"}`}>
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${selectedFormat === fmt ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{fmt === "PDF" ? <FileText size={18} /> : <ImageIcon size={18} />}</div>
                      <span className={`text-sm font-bold ${selectedFormat === fmt ? "text-blue-700" : "text-slate-700"}`}>{fmt}</span>
                    </button>
                  ))}
                </div>
                <div className="h-px bg-slate-100 my-2"></div>
                <button onClick={handleDownload} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors">Unduh {selectedFormat} Sekarang</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden bg-slate-200/50" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 shrink-0">
          <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2"><Layers size={14} /> Daftar Item</h3></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (<div className="text-center py-10 text-slate-400 text-sm">Memuat aset...</div>) : (
                pages.flatMap(page => page.items.map((item: EditorItem) => (
                    <div 
                        key={`sidebar-${item.id}`} 
                        draggable={true} 
                        onDragStart={(e) => handleSidebarDragStart(e, item)} 
                        onClick={() => scrollToItem(item, page.id)} // CLICK TO SCROLL
                        className="flex gap-3 p-2 rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer bg-white transition-all select-none group active:bg-blue-50"
                    >
                        <div className="w-12 h-12 bg-slate-50 rounded border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={generatedBadges[item.id] || item.content?.image_url || "/assets/placeholder.png"} className="w-10 h-10 object-contain mix-blend-multiply" />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                            <p className="text-xs font-bold text-slate-700 truncate">{item.content?.name || "Tanpa Nama"}</p>
                            <p className="text-[10px] font-mono text-blue-600 font-bold mt-1">{item.content?.price_display}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">Page {page.pageNumber}</p>
                        </div>
                    </div>
                )))
            )}
          </div>
        </aside>
        <main className="flex-1 relative flex flex-col min-w-0 overflow-auto items-center py-10" ref={mainContainerRef}>
          {!loading && pages.map((page: LeafletPage) => (
              <div key={page.id} className="group flex flex-col gap-2 items-center mb-10">
                <div className="flex items-center justify-between px-2 transition-all" style={{ width: 2480 * zoom }}>
                  <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded shadow-sm border border-slate-200">Halaman {page.pageNumber}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDuplicatePage(page.id)} className="p-1.5 bg-white hover:text-blue-600 rounded shadow-sm border text-slate-500"><Copy size={14} /></button>
                    <button onClick={() => handleDeletePage(page.id)} className="p-1.5 bg-white hover:text-red-600 rounded shadow-sm border text-slate-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ width: 2480 * zoom, height: 3508 * zoom, position: "relative" }} className="bg-white shadow-2xl transition-all duration-200 ease-out">
                  <div ref={(el) => { pageRefs.current[page.id] = el; }} className={`bg-white overflow-hidden origin-top-left absolute top-0 left-0 ${selectedPageId === page.id ? "ring-4 ring-blue-500/20" : ""}`} onDragOver={handleCanvasDragOver} onDrop={(e) => handleCanvasDrop(e, page.id)} onClick={() => setSelectedPageId(page.id)} style={{ width: "2480px", height: "3508px", transform: `scale(${zoom})`, backgroundImage: pageBackground ? `url(${pageBackground})` : undefined, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}>
                    {isGridEnabled && <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 divide-x divide-y divide-blue-500/20 pointer-events-none z-50 border border-blue-500/20">{[...Array(16)].map((_, i) => <div key={i}></div>)}</div>}
                    {page.items.map((item: EditorItem) => (
                      <div key={item.id} onMouseDown={(e) => handleMouseDown(e, item, page.id)} className={`absolute select-none group/item cursor-move flex flex-col ${selectedItemId === item.id ? "ring-2 ring-blue-500 z-40 shadow-xl" : "hover:ring-1 hover:ring-blue-300 z-10"}`} style={{ left: item.layout.x, top: item.layout.y, width: item.layout.w, height: item.layout.h }}>
                          {item.type === 'product_card' ? (
                                generatedBadges[item.id] ? (
                                    <img src={generatedBadges[item.id]} className="w-full h-full object-contain" alt={item.content?.name} draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 border border-slate-200 flex flex-col items-center justify-center animate-pulse">
                                        <Loader2 className="animate-spin text-slate-300 mb-2" />
                                        <span className="text-xs text-slate-400">Generating Badge...</span>
                                    </div>
                                )
                          ) : (
                                <div className="w-full h-full bg-white border border-slate-200 flex items-center justify-center relative">
                                    {item.content?.image_url && <img src={item.content.image_url} className="max-w-full max-h-full object-contain" />}
                                    {item.type === 'text' && <p className="p-2 text-center">{item.content?.name}</p>}
                                </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          <div className="transition-all pb-20" style={{ width: 2480 * zoom }}>
            <button onClick={handleAddPage} className="group flex items-center justify-center gap-3 w-full py-8 bg-slate-200/50 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl transition-all text-slate-500"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20} /></div><span className="font-bold">Tambah Halaman</span></button>
          </div>
        </main>
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-sm z-10 shrink-0">
          <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2"><MousePointer2 size={14} /> Properti</h3></div>
          <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50">
            {activeItem ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Produk</label><input type="text" className="w-full text-xs border border-slate-300 rounded p-2 bg-white" value={activeItem.content?.name ?? ""} onChange={(e) => updateItemContent('name', e.target.value)} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Harga Tampil</label><input type="text" className="w-full text-xs border border-slate-300 rounded p-2 bg-white" value={activeItem.content?.price_display ?? ""} onChange={(e) => updateItemContent('price_display', e.target.value)} /></div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ganti Gambar Produk</label>
                    <button onClick={handleOpenBankGambar} className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-xs font-medium text-slate-700 bg-white hover:bg-slate-50">
                        <FolderOpen className="w-4 h-4 mr-2" /> Ganti dari Bank Gambar
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1 text-center">Gambar akan otomatis terupdate di Bank Gambar</p>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Komponen Badge</h4>
                    <button onClick={() => refreshBadge(activeItem)} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center justify-center gap-2 mb-2"><RefreshCw size={14} /> Refresh Gambar</button>
                    
                    <div className="flex items-center justify-between"><span className="text-xs text-slate-600">Harga Coret</span><button onClick={() => toggleItemProperty('show_coret')} className={`text-slate-400 hover:text-blue-600 ${activeItem.content?.show_coret ? 'text-blue-600' : ''}`}>{activeItem.content?.show_coret ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}</button></div>
                    {activeItem.content?.show_coret && <input type="number" placeholder="Harga Asli" className="w-full text-xs border p-2 rounded" value={activeItem.content?.price_original} onChange={(e) => updateItemContent('price_original', parseFloat(e.target.value))} />}
                    <div className="flex items-center justify-between"><span className="text-xs text-slate-600">Badge BBMU</span><button onClick={() => toggleItemProperty('is_bbmu')} className={`text-slate-400 hover:text-blue-600 ${activeItem.content?.is_bbmu ? 'text-blue-600' : ''}`}>{activeItem.content?.is_bbmu ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}</button></div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">X</label><input type="text" className="w-full text-xs border border-slate-300 rounded p-2 font-mono" value={Math.round(activeItem.layout.x)} readOnly /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Y</label><input type="text" className="w-full text-xs border border-slate-300 rounded p-2 font-mono" value={Math.round(activeItem.layout.y)} readOnly /></div>
                </div>
                <div className="pt-4 border-t border-slate-200"><button onClick={handleDeleteItem} className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={14} /> Hapus Item</button></div>
              </div>
            ) : (<div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs"><p>Pilih elemen di canvas</p></div>)}
          </div>
        </aside>
      </div>

      <ProductUploadModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        productToEdit={productToEdit}
      />
    </div>
  );
};

export default EditorPage;