import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { LeafletService } from "../services/leafletService";
import ProductUploadModal from "../components/ProductUploadModal";
import layoutCoverJson from "../data/layout_cover.json";
import layoutInnerJson from "../data/layout_inner.json";
import { getProducts } from "../services/productService";
import { fetchSmartGridRules } from "../services/smartGridService";
import { applyAprioriSorting } from "../utils/aprioriSorter";
import {
  ZoomIn, ZoomOut, Layers, MousePointer2, ArrowLeft, Plus, Trash2, Copy, Grid, 
  CheckCircle2, ChevronDown, FileText, Image as ImageIcon, Loader2, Download, 
  ToggleLeft, ToggleRight, RefreshCw, FolderOpen, Map as MapIcon, Globe, PlusSquare
} from "lucide-react";
import type { LeafletPage, EditorItem, BackendPage, BackendItem, ItemContent } from "../types";

interface FigmaNode {
  id: string;
  type: string;
  name?: string;
  visible?: boolean;
  absoluteBoundingBox: { x: number; y: number; width: number; height: number };
  children?: FigmaNode[];
  characters?: string;
  fills?: { type: string; color?: { r: number; g: number; b: number }; opacity?: number }[];
  fontSize?: number;
  opacity?: number;
}

interface Product {
  id: number;
  plu_code: string;
  name: string;
  image_path: string;
}

interface PageWithDimensions extends LeafletPage {
  width?: number;
  height?: number;
  items: (EditorItem & { component_name?: string })[]; 
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Rule {
  rule_id: number;
  antecedent: string;
  consequent: string;
  support_percent: string;
  confidence_percent: string;
  lift_ratio: string;
  keterangan: string;
}

interface AprioriStepRule {
  rule: string;
  support_A_B: number;
  confidence: number;
  lift_ratio: number;
  is_valid: boolean;
}

interface AprioriSteps {
  rules_calculation: AprioriStepRule[];
  min_support: number;
  min_confidence: number;
}

interface AprioriData {
  isReady: boolean;
  totalTransactions: number;
  rules: Rule[];
  steps?: AprioriSteps | null;
}

const LAYOUT_COVER = layoutCoverJson as unknown as FigmaNode[];
const LAYOUT_INNER = layoutInnerJson as unknown as FigmaNode[];

const processAssetUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith('http')) return url;
   
  const BACKEND_URL = "http://127.0.0.1:8000";
  if (url.startsWith('products/') || url.includes('storage/')) {
      const cleanPath = url.replace('public/', '').replace(/^\/+/, '');
      if (cleanPath.startsWith('storage')) return `${BACKEND_URL}/${cleanPath}`;
      return `${BACKEND_URL}/storage/${cleanPath}`;
  }

  if (!url.startsWith('/') && !url.startsWith('assets') && !url.startsWith('storage')) return `/assets/${url}`;
  if (!url.startsWith('/')) return `/${url}`;
  return url;
};

const extractSlots = (layoutData: FigmaNode[]): Slot[] => {
    if (!layoutData || !layoutData[0]) return [];
    const parentBox = layoutData[0].absoluteBoundingBox;
    const flattenChildren = (nodes: FigmaNode[]): FigmaNode[] => {
        let result: FigmaNode[] = [];
        nodes.forEach(node => {
            result.push(node);
            if (node.children) {
                result = result.concat(flattenChildren(node.children));
            }
        });
        return result;
    };

    const allNodes = flattenChildren(layoutData[0].children || []);
    const slots = allNodes.filter((child) => child.name && child.name.startsWith("slot_"));

    slots.sort((a, b) => {
        const numA = parseInt(a.name?.replace('slot_', '') || '0');
        const numB = parseInt(b.name?.replace('slot_', '') || '0');
        return numA - numB;
    });

    return slots.map((slot) => ({
        x: slot.absoluteBoundingBox.x - parentBox.x,
        y: slot.absoluteBoundingBox.y - parentBox.y,
        w: slot.absoluteBoundingBox.width,
        h: slot.absoluteBoundingBox.height
    }));
};

const RenderStaticLayout = ({ layoutData, pageBackground }: { layoutData: FigmaNode[], pageBackground: string | null }) => {
    if (!layoutData || !layoutData[0]) return null;

    const parentBox = layoutData[0].absoluteBoundingBox;

    const renderNode = (node: FigmaNode) => {
        if (!node || node.visible === false) return null;

        if (node.type === "GROUP" || node.type === "FRAME") {
             return node.children?.map((child) => (
                <React.Fragment key={child.id}>
                    {renderNode(child)}
                </React.Fragment>
             ));
        }

        if (!node.absoluteBoundingBox) return null;

        const left = node.absoluteBoundingBox.x - parentBox.x;
        const top = node.absoluteBoundingBox.y - parentBox.y;
        const width = node.absoluteBoundingBox.width;
        const height = node.absoluteBoundingBox.height;

        let content = null;

        if (node.name?.startsWith("img_")) {
            const isDynamicBg = node.name === "img_bg_layout_cover" || node.name === "img_bg_layout_inner";
            const imgSrc = (isDynamicBg && pageBackground) ? pageBackground : `/assets/${node.name}.png`;

            content = (
                <img 
                    src={imgSrc} 
                    alt={node.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            );
        } else if (node.type === "TEXT") {
                content = (
                <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: node.fills?.[0]?.color ? `rgb(${Math.round(node.fills[0].color.r * 255)}, ${Math.round(node.fills[0].color.g * 255)}, ${Math.round(node.fills[0].color.b * 255)})` : '#000',
                    fontSize: `${(node.fontSize || 40) * 0.8}px`, fontWeight: 'bold', textAlign: 'center'
                }}>
                    {node.characters || ""}
                </div>
            );
        } else if (node.fills && node.fills.length > 0 && node.fills[0].type === "SOLID") {
            const color = node.fills[0].color;
            if(color) {
                const r = Math.round(color.r * 255);
                const g = Math.round(color.g * 255);
                const b = Math.round(color.b * 255);
                content = (
                    <div style={{ width: '100%', height: '100%', backgroundColor: `rgb(${r},${g},${b})`, opacity: node.opacity ?? 1 }} />
                );
            }
        }

        if (node.name?.startsWith("slot_")) {
            return null;
        }

        return (
            <div key={node.id} style={{ position: 'absolute', left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, zIndex: 0 }}>
                {content}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
             {layoutData[0].children?.map((child) => (
                 <React.Fragment key={child.id}>
                    {renderNode(child)}
                 </React.Fragment>
             ))}
        </div>
    );
};

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [leaflets, setLeaflets] = useState<Record<string, PageWithDimensions[]>>({});
  const [activeRegion, setActiveRegion] = useState<string>("DEFAULT");
  const [regionNames, setRegionNames] = useState<string[]>([]);
  
  const pages = useMemo(() => leaflets[activeRegion] || [], [leaflets, activeRegion]);
  
  const setPages = useCallback((value: React.SetStateAction<PageWithDimensions[]>) => {
    setLeaflets(prev => {
        const currentPages = prev[activeRegion] || [];
        const updatedPages = typeof value === 'function' ? value(currentPages) : value;
        return { ...prev, [activeRegion]: updatedPages };
    });
  }, [activeRegion]);

  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.25);
  const [designName, setDesignName] = useState("Draft Otomatis");
  const [storeName, setStoreName] = useState("");
  const [isGridEnabled, setIsGridEnabled] = useState(false);
  const [leafletId, setLeafletId] = useState<string | undefined>(undefined);
  const [pageBackground, setPageBackground] = useState<string | null>(null);

  const [isSmartGridActive, setIsSmartGridActive] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [aprioriData, setAprioriData] = useState<AprioriData>({ isReady: true, totalTransactions: 0, rules: [] });
  const originalLeafletsRef = useRef<Record<string, PageWithDimensions[]>>({});

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(""); 
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [selectedFormat, setSelectedFormat] = useState<"PDF" | "JPG" | "PNG">("PDF");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragActivePageId, setDragActivePageId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [generatedBadges, setGeneratedBadges] = useState<Record<string, string>>({});
  const [generatingBadges, setGeneratingBadges] = useState<Record<string, boolean>>({});

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);

  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const reloadSmartGridData = useCallback(async () => {
      const data = await fetchSmartGridRules(activeRegion);
      if (data) {
          setAprioriData({
              isReady: true,
              totalTransactions: data.total_transactions || 0,
              rules: data.rules || [],
              steps: data.steps || null
          });
      }
  }, [activeRegion]);

  useEffect(() => {
      reloadSmartGridData();
  }, [reloadSmartGridData]);

  const handleSmartGridToggleClick = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.checked;
      setIsSmartGridActive(newValue);
      if (!newValue) setShowCalcModal(false);

      if (newValue) {
          originalLeafletsRef.current = JSON.parse(JSON.stringify(leaflets));
          const newLeaflets = { ...leaflets };

          Object.keys(newLeaflets).forEach(region => {
              newLeaflets[region] = newLeaflets[region].map(page => {
                  const sortedItems = applyAprioriSorting(page.items, aprioriData.rules);
                  const layoutRef = page.pageNumber === 1 ? LAYOUT_COVER : LAYOUT_INNER;
                  const slots = extractSlots(layoutRef);

                  const plottedItems = sortedItems.map((item, index) => {
                      const targetSlot = slots[index];
                      if (targetSlot) {
                          return {
                              ...item,
                              layout: { x: targetSlot.x, y: targetSlot.y, w: targetSlot.w, h: targetSlot.h }
                          };
                      }
                      return item;
                  });

                  return { ...page, items: plottedItems };
              });
          });
          setLeaflets(newLeaflets);
      } else {
          if (Object.keys(originalLeafletsRef.current).length > 0) {
              setLeaflets(originalLeafletsRef.current);
          }
      }
  };

  const saveData = useCallback(
    async (status: "draft" | "exported") => {
      if (Object.keys(leaflets).length === 0) return;
      setSaveStatus("saving");
      
      try {
        let payload;
        if (regionNames.length === 1 && regionNames[0] === 'DEFAULT') {
             payload = {
                id: leafletId,
                title: designName,
                store: storeName,
                pages: leaflets['DEFAULT'],
                status: status,
                template_url: pageBackground 
             };
        } else {
             payload = {
                 id: leafletId,
                 title: designName,
                 store: storeName,
                 regions_data: leaflets,
                 status: status,
                 template_url: pageBackground
             };
        }

        const response = await LeafletService.saveLeaflet(payload);
        
        if (response && response.id) setLeafletId(response.id);
        setSaveStatus("saved");
        
        if (status === "exported") {
             await reloadSmartGridData();
        }
      } catch (error) {
        console.error(error);
        setSaveStatus("unsaved");
      }
    },
    [designName, storeName, leaflets, leafletId, regionNames, pageBackground, reloadSmartGridData]
  );

  useEffect(() => {
    const handleProductUpdated = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { plu_code, image_url } = customEvent.detail;
        const newImageUrl = `${processAssetUrl(image_url)}?t=${Date.now()}`;

        const itemsToUpdate: string[] = [];

        setLeaflets(prevLeaflets => {
            const newLeaflets = { ...prevLeaflets };
            Object.keys(newLeaflets).forEach(region => {
                newLeaflets[region] = newLeaflets[region].map(page => ({
                    ...page,
                    items: page.items.map(item => {
                        const content = item.content as unknown as Record<string, string>;
                        if (item.plu === plu_code || content?.plu_code === plu_code) {
                            itemsToUpdate.push(item.id);
                            return {
                                ...item,
                                content: {
                                    ...item.content,
                                    image_url: newImageUrl,
                                    img_product: newImageUrl
                                },
                                needs_manual_image: false
                            } as EditorItem;
                        }
                        return item;
                    })
                } as PageWithDimensions));
            });
            return newLeaflets;
        });

        setGeneratedBadges(prev => {
            const newState = { ...prev };
            itemsToUpdate.forEach(id => delete newState[id]);
            return newState;
        });
    };

    window.addEventListener("productUpdated", handleProductUpdated);

    return () => {
        window.removeEventListener("productUpdated", handleProductUpdated);
    };
  }, []);

  const parsePagesFromBackend = (pagesData: BackendPage[]): PageWithDimensions[] => {
      const coverSlots = extractSlots(LAYOUT_COVER);
      const innerSlots = extractSlots(LAYOUT_INNER);
      
      const allProducts: BackendItem[] = [];
      if (pagesData && Array.isArray(pagesData)) {
          pagesData.forEach((p) => {
              if (p.items) allProducts.push(...p.items);
          });
      }

      const newPages: PageWithDimensions[] = [];
      let productIndex = 0;
      let pageCount = 1;

      while (productIndex < allProducts.length) {
          const isCover = pageCount === 1;
          const currentSlots = isCover ? coverSlots : innerSlots;
          const layoutRef = isCover ? LAYOUT_COVER : LAYOUT_INNER;
          const pageWidth = layoutRef[0].absoluteBoundingBox.width;
          const pageHeight = layoutRef[0].absoluteBoundingBox.height;

          const pageItems: (EditorItem & { component_name?: string })[] = [];

          for (let i = 0; i < currentSlots.length && productIndex < allProducts.length; i++) {
              const slot = currentSlots[i];
              const itemData = allProducts[productIndex] as unknown as Record<string, unknown>;
              
              const raw = (itemData.data || itemData.content || {}) as Record<string, unknown>;
              const componentName = (itemData.component_name as string) || "card_cover_master";

              const plu = (itemData.plu as string) || (raw.plu_code as string) || "";
              
              const imgUrl = (raw.img_product as string) || (raw.image_url as string) || "placeholder.png";
              const productId = (raw.product_id as number) || (typeof raw.id === 'number' ? raw.id : undefined);

              const hasCoret = Boolean(raw.show_coret || (raw.txt_coret && raw.txt_coret !== ''));
              const hasKeterangan = Boolean(raw.txt_keterangan);

              pageItems.push({
                  id: (itemData.id as string) || `auto-item-${productIndex}-${Date.now()}`,
                  plu: plu,
                  type: (itemData.type as string) || 'product_card',
                  component_name: componentName,
                  content: {
                      ...raw,
                      product_id: productId,
                      name: (raw.txt_name as string) || (raw.name as string) || "Nama Barang",
                      price_display: (raw.txt_price as string) || (raw.price_display as string) || "",
                      image_url: processAssetUrl(imgUrl),
                      img_product: processAssetUrl(imgUrl),
                      show_coret: hasCoret,
                      show_keterangan: hasKeterangan
                  } as ItemContent,
                  needs_manual_image: false, 
                  layout: {
                      x: slot.x,
                      y: slot.y,
                      w: slot.w,
                      h: slot.h
                  }
              });

              productIndex++;
          }

          newPages.push({
              id: `page-${pageCount}-${Math.random()}`,
              pageNumber: pageCount,
              width: pageWidth,
              height: pageHeight,
              items: pageItems
          });

          pageCount++;
      }

      if (newPages.length === 0) {
          const w = LAYOUT_COVER[0].absoluteBoundingBox.width;
          const h = LAYOUT_COVER[0].absoluteBoundingBox.height;
          newPages.push({ id: "page-1", pageNumber: 1, width: w, height: h, items: [] });
      }
      
      return newPages;
  };

  useEffect(() => {
    const backendData = location.state?.leafletData as Record<string, unknown>;
    const initialName = location.state?.leafletName;
    const storeFromNav = location.state?.storeName;
    const templateUrl = location.state?.templateUrl;

    const initEditor = async () => {
        if (backendData?.template_url) {
            setPageBackground(processAssetUrl(backendData.template_url as string));
        } else if (templateUrl) {
            setPageBackground(processAssetUrl(templateUrl));
        }

        try {
             await getProducts(); 
        } catch (error) {
            console.error(error);
        }

        if (backendData) {
            const rawKeys = Object.keys(backendData);
            
            const knownRegions = ['JAWA', 'KAL', 'SUL', 'SUM', 'AMB', 'MALUKU', 'BALI', 'NTB', 'NTT', 'PAPUA'];
            
            const regionKeys = rawKeys.filter(k => {
                const upperK = k.toUpperCase();
                const isKnown = knownRegions.some(region => upperK.includes(region));
                const hasContent = backendData[k] && (Array.isArray(backendData[k]) || (backendData[k] as Record<string, unknown>).pages);
                return isKnown && hasContent;
            });

            const isMultiRegion = regionKeys.length > 0;
            
            const initLeaflets: Record<string, PageWithDimensions[]> = {};
            const regions: string[] = [];

            if (isMultiRegion) {
                regionKeys.forEach(regionKey => {
                    const regionData = backendData[regionKey];
                    const pagesToParse = Array.isArray(regionData) ? regionData : ((regionData as Record<string, unknown>).pages as BackendPage[] || []);
                    
                    if (pagesToParse && pagesToParse.length > 0) {
                        initLeaflets[regionKey] = parsePagesFromBackend(pagesToParse);
                        regions.push(regionKey);
                    }
                });
                
                regions.sort(); 

                if (regions.length > 0) {
                    const firstRegion = regions[0];
                    const firstRegionData = backendData[firstRegion] as Record<string, unknown>;
                    setDesignName((firstRegionData?.leaflet_name as string) || initialName || "Leaflet All Regions");
                    setStoreName("ALL REGIONS");
                    if (firstRegionData?.id) setLeafletId(firstRegionData.id as string);
                }
            } else {
                const pagesData = (backendData.pages as BackendPage[]) || (Array.isArray(backendData) ? backendData : []) || (backendData.items as BackendPage[]) || [];
                initLeaflets['DEFAULT'] = parsePagesFromBackend(pagesData);
                regions.push('DEFAULT');
                setDesignName(initialName || (backendData.leaflet_name as string) || "New Leaflet");
                setStoreName(storeFromNav || (backendData.store as string) || "Region");
                if (backendData.id) setLeafletId(backendData.id as string);
            }

            setLeaflets(initLeaflets);
            setRegionNames(regions);
            setActiveRegion(regions[0] || 'DEFAULT');
            setLoading(false);
        } else {
            const w = 2480, h = 3508;
            setLeaflets({ 'DEFAULT': [{ id: "page-1", pageNumber: 1, width: w, height: h, items: [] }] });
            setRegionNames(['DEFAULT']);
            setActiveRegion('DEFAULT');
            setLoading(false);
        }
    };

    initEditor();
  }, [location.state]);

  const generateBadgeForItem = useCallback(async (item: EditorItem & { component_name?: string }) => {
      const compName = item.component_name || "card_cover_master";
      if (!item.content) return;
      setGeneratingBadges(prev => ({...prev, [item.id]: true}));
      try {
          const apiData: Record<string, unknown> = {
              ...item.content,
              txt_name: item.content.name,
              txt_price: item.content.price_display,
              img_product: item.content.image_url,
              show_coret: item.content.show_coret,
              show_keterangan: item.content.show_keterangan,
              is_bbmu: (item.content as unknown as Record<string, unknown>).is_bbmu
          };
          const content = item.content as unknown as Record<string, Record<string, unknown>>;
          if (content.badge_igr) {
             apiData.badge_igr = content.badge_igr;
             if (content.badge_igr.active) {
                apiData.txt_keterangan_qty_igr = content.badge_igr.txt_keterangan_qty_igr;
                apiData.txt_satuan_igr = content.badge_igr.txt_satuan_igr;
                apiData.txt_price_bonus_igr = content.badge_igr.txt_price_bonus_igr;
             }
          }
          if (content.badge_spi) {
             apiData.badge_spi = content.badge_spi;
             if (content.badge_spi.active) {
                apiData.txt_keterangan_qty_spi = content.badge_spi.txt_keterangan_qty_spi;
                apiData.txt_satuan_spi = content.badge_spi.txt_satuan_spi;
                apiData.txt_price_bonus_spi = content.badge_spi.txt_price_bonus_spi;
             }
          }
          if (content.badge_promo) {
             apiData.badge_promo = content.badge_promo;
             if (content.badge_promo.active) {
                apiData.txt_qty_promo = content.badge_promo.txt_qty_promo;
                apiData.txt_price_promo = content.badge_promo.txt_price_promo;
                apiData.txt_keterangan_promo = content.badge_promo.txt_keterangan_promo;
                apiData.txt_satuan = content.badge_promo.txt_satuan;
             }
          }
          const url = await LeafletService.generateBadge(compName, apiData);
          const fullUrl = `${processAssetUrl(url)}?t=${Date.now()}`;
          setGeneratedBadges(prev => ({...prev, [item.id]: fullUrl}));
      } catch (error) {
          console.error(error);
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
          page.items.forEach((item) => {
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
  }, [leaflets, designName, loading, saveData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNearestSlot = (dropX: number, dropY: number, pageNumber: number): { x: number; y: number; w: number; h: number } | null => {
    const layout = pageNumber === 1 ? LAYOUT_COVER : LAYOUT_INNER;
    const slots = extractSlots(layout);
    let nearestSlot = null;
    let minDistance = Infinity;
    slots.forEach((slot) => {
      const centerX = slot.x + slot.w / 2;
      const centerY = slot.y + slot.h / 2;
      const distance = Math.sqrt(Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearestSlot = slot;
      }
    });
    return nearestSlot;
  };

  const scrollToItem = (item: EditorItem, pageId: string) => {
    setSelectedItemId(item.id);
    setSelectedPageId(pageId);
    const pageElement = pageRefs.current[pageId];
    if (pageElement && mainContainerRef.current) {
        const pageRect = pageElement.getBoundingClientRect();
        const containerRect = mainContainerRef.current.getBoundingClientRect();
        const relativeY = (item.layout.y * zoom);
        const newScrollTop = mainContainerRef.current.scrollTop + (pageRect.top - containerRect.top) + relativeY - 100;
        mainContainerRef.current.scrollTo({ top: newScrollTop, behavior: 'smooth' });
    }
  };

  const capturePages = async (targetPages: PageWithDimensions[]): Promise<string[]> => {
    const images: string[] = [];
    for (const page of targetPages) {
        const element = pageRefs.current[page.id];
        if (element) {
            const options = { scale: 2, useCORS: true, logging: false, allowTaint: true };
            const canvas = await html2canvas(element, options as Parameters<typeof html2canvas>[1]);
            const imgData = canvas.toDataURL(selectedFormat === "PDF" ? "image/jpeg" : `image/${selectedFormat.toLowerCase()}`, 0.9);
            images.push(imgData);
        }
    }
    return images;
  };

  const handleDownload = async () => {
    setIsDownloadMenuOpen(false);
    setIsDownloading(true);
    setDownloadProgress("Menyiapkan layout...");
    
    const originalZoom = zoom;
    const originalActiveRegion = activeRegion;
    setZoom(1); 
    
    await new Promise(r => setTimeout(r, 800));

    try {
        const isBulk = regionNames.length > 1 && regionNames.some(r => r !== 'DEFAULT');
        const zip = new JSZip();

        if (isBulk) {
            for (const region of regionNames) {
                if (region === 'ALL') continue;
                
                setDownloadProgress(`Memproses wilayah ${region}...`);
                setActiveRegion(region);
                await new Promise(r => setTimeout(r, 1000)); 

                const currentRegionPages = leaflets[region] || [];
                const capturedImages = await capturePages(currentRegionPages);

                if (selectedFormat === "PDF") {
                    const doc = new jsPDF("p", "mm", "a4");
                    capturedImages.forEach((imgData, i) => {
                        if (i > 0) doc.addPage();
                        doc.addImage(imgData, "JPEG", 0, 0, 210, 297);
                    });
                    const pdfBlob = doc.output('blob');
                    zip.file(`${designName}_${region}.pdf`, pdfBlob);
                } else {
                    const regionFolder = zip.folder(region);
                    capturedImages.forEach((imgData, i) => {
                        const base64Data = imgData.split(',')[1];
                        regionFolder?.file(`Page_${i + 1}.${selectedFormat.toLowerCase()}`, base64Data, { base64: true });
                    });
                }
            }

            setDownloadProgress("Mengompres file...");
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${designName}_ALL_REGIONS.zip`);

        } else {
            const currentRegionPages = leaflets[activeRegion] || [];
            const capturedImages = await capturePages(currentRegionPages);

            if (selectedFormat === "PDF") {
                const doc = new jsPDF("p", "mm", "a4");
                capturedImages.forEach((imgData, i) => {
                    if (i > 0) doc.addPage();
                    doc.addImage(imgData, "JPEG", 0, 0, 210, 297);
                });
                doc.save(`${designName}_${activeRegion}.pdf`);
            } else {
                if (capturedImages.length === 1) {
                    saveAs(capturedImages[0], `${designName}_${activeRegion}.${selectedFormat.toLowerCase()}`);
                } else {
                    capturedImages.forEach((imgData, i) => {
                        const base64Data = imgData.split(',')[1];
                        zip.file(`Page_${i + 1}.${selectedFormat.toLowerCase()}`, base64Data, { base64: true });
                    });
                    const content = await zip.generateAsync({ type: "blob" });
                    saveAs(content, `${designName}_${activeRegion}.zip`);
                }
            }
        }

        await saveData("exported");
    } catch (error) {
        console.error(error);
        alert("Gagal mengunduh dokumen.");
    } finally {
        setActiveRegion(originalActiveRegion);
        setZoom(originalZoom);
        setIsDownloading(false);
        setDownloadProgress("");
    }
  };

  const handleAddPage = () => {
    const newPageId = `page-${Date.now()}`;
    setPages((prev) => [...prev, { id: newPageId, pageNumber: prev.length + 1, width: 2480, height: 3508, items: [] } as PageWithDimensions]);
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
      newPages.splice(idx + 1, 0, { id: newPageId, pageNumber: 0, width: pageToClone.width, height: pageToClone.height, items: clonedItems } as PageWithDimensions);
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
    const targetPage = pages.find(p => p.id === pageId);
    const pageNum = targetPage ? targetPage.pageNumber : 1;
    const nearestSlot = getNearestSlot(mouseX, mouseY, pageNum);
    let finalLayout;
    if (droppedItem.type === 'product_card' && nearestSlot) {
        finalLayout = { x: nearestSlot.x, y: nearestSlot.y, w: nearestSlot.w, h: nearestSlot.h };
    } else {
        finalLayout = { x: mouseX - (droppedItem.layout.w || 400) / 2, y: mouseY - (droppedItem.layout.h || 400) / 2, w: droppedItem.layout.w || 400, h: droppedItem.layout.h || 400 };
    }
    const newItem: EditorItem = { ...droppedItem, id: `item-${Date.now()}`, layout: finalLayout };
    setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, items: [...p.items, newItem] } as PageWithDimensions : p));
    setSelectedItemId(newItem.id);
    setSelectedPageId(pageId);
    setGeneratedBadges(prev => ({...prev, [newItem.id]: generatedBadges[droppedItem.id] || ""}));
  };

  const handleAddDummyProduct = useCallback(() => {
    const targetPageId = selectedPageId || pages[0]?.id;
    const page = pages.find(p => p.id === targetPageId) || pages[0];
    if (!page) return;

    const layoutRef = page.pageNumber === 1 ? LAYOUT_COVER : LAYOUT_INNER;
    const slots = extractSlots(layoutRef);

    const emptySlot = slots.find(slot => !page.items.some(item => 
        Math.abs(item.layout.x - slot.x) < 5 && Math.abs(item.layout.y - slot.y) < 5
    ));

    if (!emptySlot) {
        alert("Halaman ini sudah penuh. Silakan tambah halaman baru.");
        return;
    }

    const newId = `manual-item-${Date.now()}`;
    
    const newItem: EditorItem = {
      id: newId,
      plu: "00000",
      type: "product_card",
      component_name: "card_cover_master",
      layout: { x: emptySlot.x, y: emptySlot.y, w: emptySlot.w, h: emptySlot.h },
      content: {
        name: "Nama Produk Baru",
        price_display: "Rp 0",
        image_url: "/assets/placeholder.png", 
        img_product: "/assets/placeholder.png",
        show_coret: false,
        price_original: 0,
        txt_coret: "",
        show_keterangan: false,
        txt_keterangan: "",
        is_bbmu: false,
        badge_igr: { active: false, txt_keterangan_qty_igr: "", txt_satuan_igr: "", txt_price_bonus_igr: "" },
        badge_spi: { active: false, txt_keterangan_qty_spi: "", txt_satuan_spi: "", txt_price_bonus_spi: "" },
        badge_promo: { active: false, txt_qty_promo: "", txt_price_promo: "", txt_keterangan_promo: "", txt_satuan: "" }
      },
      needs_manual_image: true
    };

    setPages((prev) => prev.map((p) => {
        if(p.id === page.id) {
            return { ...p, items: [...p.items, newItem] };
        }
        return p;
    }));

    generateBadgeForItem(newItem);
    setSelectedItemId(newItem.id);
    setSelectedPageId(page.id);
  }, [pages, selectedPageId, generateBadgeForItem, setPages]);

  const handleMouseDown = (e: React.MouseEvent, item: EditorItem, pageId: string) => {
    e.stopPropagation();
    const currentCanvas = pageRefs.current[pageId];
    if (!item.layout || !currentCanvas) return;
    setSelectedItemId(item.id);
    setSelectedPageId(pageId);
    const canvasRect = currentCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;
    setDraggingId(item.id);
    setDragOffset({ x: mouseX - item.layout.x, y: mouseY - item.layout.y });
    setDragActivePageId(pageId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragActivePageId) return;
    const currentCanvas = pageRefs.current[dragActivePageId];
    if (!currentCanvas) return;
    e.preventDefault();
    const canvasRect = currentCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;
    if (draggingId) {
      setPages((prevPages) => prevPages.map((page) => {
          if (page.id !== dragActivePageId) return page;
          return {
            ...page,
            items: page.items.map((item) => {
              if (item.id === draggingId) {
                const newX = mouseX - dragOffset.x;
                const newY = mouseY - dragOffset.y;
                return { ...item, layout: { ...item.layout, x: newX, y: newY } };
              }
              return item;
            }),
          };
        })
      );
    } 
  };

  const handleMouseUp = () => {
    if (draggingId && dragActivePageId) {
        const page = pages.find(p => p.id === dragActivePageId);
        const item = page?.items.find(i => i.id === draggingId);
        if (page && item && item.type === 'product_card') {
            const centerItemX = item.layout.x + item.layout.w / 2;
            const centerItemY = item.layout.y + item.layout.h / 2;
            const nearestSlot = getNearestSlot(centerItemX, centerItemY, page.pageNumber);
            if (nearestSlot) {
                 setPages((prev) => prev.map((p) => {
                    if (p.id !== dragActivePageId) return p;
                    return {
                        ...p,
                        items: p.items.map(i => {
                            if (i.id === draggingId) {
                                return { ...i, layout: { x: nearestSlot.x, y: nearestSlot.y, w: nearestSlot.w, h: nearestSlot.h } }
                            }
                            return i;
                        })
                    } as PageWithDimensions;
                 }));
            }
        }
    }
    setDraggingId(null);
    setDragActivePageId(null);
  };

  const handleDeleteItem = () => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) => prev.map((page: LeafletPage) => page.id === selectedPageId ? { ...page, items: page.items.filter((i: EditorItem) => i.id !== selectedItemId) } : page));
    setSelectedItemId(null);
  };

  const toggleBooleanProperty = (key: string) => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) => prev.map((page) => {
            if (page.id !== selectedPageId) return page;
            const updatedItems = page.items.map((item) => {
                if (item.id !== selectedItemId) return item;
                if (!item.content) return item;
                const contentRecord = item.content as unknown as Record<string, boolean>;
                return { ...item, content: { ...item.content, [key]: !contentRecord[key] } };
            });
            return { ...page, items: updatedItems as EditorItem[] } as PageWithDimensions;
        })
    );
  };

  const toggleBadge = (badgeKey: string) => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) => prev.map((page) => {
            if (page.id !== selectedPageId) return page;
            const updatedItems = page.items.map((item) => {
                if (item.id !== selectedItemId) return item;
                if (!item.content) return item;
                const contentRecord = item.content as unknown as Record<string, { active?: boolean }>;
                const currentBadge = contentRecord[badgeKey];
                const isActive = currentBadge?.active;
                const defaultBadgeIGR = { active: true, txt_keterangan_qty_igr: "Setiap Pembelian 1", txt_satuan_igr: "Pcs", txt_price_bonus_igr: "BONUS 100" };
                const defaultBadgeSPI = { active: true, txt_keterangan_qty_spi: "Setiap Pembelian 1", txt_satuan_spi: "Pcs", txt_price_bonus_spi: "Bonus 2.000" };
                const defaultBadgePromo = { active: true, txt_qty_promo: "BELI 2", txt_price_promo: "GRATIS", txt_keterangan_promo: "Produk Serupa", txt_satuan: "Pcs" };
                let newBadgeData;
                if (!currentBadge) {
                    if (badgeKey === 'badge_igr') newBadgeData = defaultBadgeIGR;
                    else if (badgeKey === 'badge_spi') newBadgeData = defaultBadgeSPI;
                    else if (badgeKey === 'badge_promo') newBadgeData = defaultBadgePromo;
                } else {
                    newBadgeData = { ...currentBadge, active: !isActive };
                }
                return { ...item, content: { ...item.content, [badgeKey]: newBadgeData } };
            });
            return { ...page, items: updatedItems as EditorItem[] } as PageWithDimensions;
        })
    );
  };

  const updateItemContent = (key: string, value: string | number | boolean | null) => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) => prev.map((page) => {
            if (page.id !== selectedPageId) return page;
            const updatedItems = page.items.map((item) => {
                if (item.id !== selectedItemId) return item;
                if (!item.content) return item;
                return { ...item, content: { ...item.content, [key]: value } };
            });
            return { ...page, items: updatedItems as EditorItem[] } as PageWithDimensions;
        })
    );
  };
  
  const updateNestedContent = (parentKey: string, childKey: string, value: string) => {
    if (!selectedPageId || !selectedItemId) return;
    setPages((prev) => prev.map((page) => {
            if (page.id !== selectedPageId) return page;
            const updatedItems = page.items.map((item) => {
                if (item.id !== selectedItemId) return item;
                if (!item.content) return item;
                const contentRecord = item.content as unknown as Record<string, Record<string, string>>;
                const parentObj = contentRecord[parentKey] || {};
                return { ...item, content: { ...item.content, [parentKey]: { ...parentObj, [childKey]: value } } };
            });
            return { ...page, items: updatedItems as EditorItem[] } as PageWithDimensions;
        })
    );
  };

  const handleOpenBankGambar = () => {
     if (!selectedItemId || !selectedPageId) return;
     const item = getSelectedItem();
     const content = item?.content as ItemContent | undefined;
     const realProductId = content?.product_id;
     if (item) {
         setProductToEdit({ id: (realProductId || 0) as number, plu_code: item.plu || content?.plu_code || "", name: content?.name || "", image_path: "" } as Product);
         setIsProductModalOpen(true);
     }
  };

  const handleCloseProductModal = () => {
      setIsProductModalOpen(false);
      setProductToEdit(undefined);
      const item = getSelectedItem();
      if (item) refreshBadge(item);
  };

  const refreshBadge = (item: EditorItem) => {
      setGeneratedBadges(prev => { const newState = {...prev}; delete newState[item.id]; return newState; });
      generateBadgeForItem(item);
  };

  const getSelectedItem = () => {
    if (!selectedPageId || !selectedItemId) return null;
    return pages.find((p) => p.id === selectedPageId)?.items.find((i: EditorItem) => i.id === selectedItemId);
  };

  const activeItem = getSelectedItem();
  
  const currentPage = useMemo(() => {
     return pages.find(p => p.id === selectedPageId) || pages[0] || { id: "temp-page", pageNumber: 1, width: 2480, height: 3508, items: [] };
  }, [pages, selectedPageId]);

  const hasEmptySlot = useMemo(() => {
    if (!currentPage || !currentPage.items) return false;
    const layoutRef = currentPage.pageNumber === 1 ? LAYOUT_COVER : LAYOUT_INNER;
    const slots = extractSlots(layoutRef);
    return slots.some(slot => !currentPage.items.some(item => 
        Math.abs(item.layout.x - slot.x) < 5 && Math.abs(item.layout.y - slot.y) < 5
    ));
  }, [currentPage]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 h-screen w-screen overflow-hidden font-sans">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/pilih-template")} className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 rounded-full text-slate-700 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <div className="flex flex-col">
              <input type="text" value={designName} onChange={(e) => setDesignName(e.target.value)} className="text-lg font-semibold text-slate-800 outline-none hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded px-2 -ml-2 transition-all w-80" />
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium px-2">
                  <Globe size={12} className="text-blue-500" />
                  <span>{storeName}</span>
                  {activeRegion !== 'DEFAULT' && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{activeRegion}</span>
                      </>
                  )}
              </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
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
          
          <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200 shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                      checked={isSmartGridActive} 
                      onChange={handleSmartGridToggleClick} 
                  />
                  <span className="text-xs font-bold text-slate-700">Grid Cerdas</span>
              </label>
              {isSmartGridActive && (
                  <button 
                      onClick={() => setShowCalcModal(true)} 
                      className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[10px] font-bold border border-blue-200 transition-colors"
                  >
                      Tampilkan Perhitungan
                  </button>
              )}
          </div>

          <div className="relative" ref={downloadMenuRef}>
            <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} disabled={isDownloading} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-slate-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
              {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {isDownloading ? "Processing..." : "Download"}
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
          
          {(regionNames.length > 1 || (regionNames.length > 0 && regionNames[0] !== 'DEFAULT')) && (
              <div className="flex flex-col bg-slate-100 border-b border-slate-300">
                  <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <MapIcon size={12} /> Wilayah (Sheet)
                  </div>
                  <div className="flex flex-row overflow-x-auto px-2 gap-1 custom-scrollbar pb-0">
                      {regionNames.map((region) => (
                          region !== 'ALL' && (
                            <button 
                                key={region}
                                onClick={() => {
                                    setActiveRegion(region);
                                    setSelectedPageId(null);
                                    setSelectedItemId(null);
                                }}
                                disabled={isDownloading}
                                className={`
                                    relative px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-l border-r whitespace-nowrap
                                    ${activeRegion === region 
                                      ? "bg-white border-slate-300 border-b-transparent text-blue-600 z-10 top-px shadow-[0_-2px_5px_rgba(0,0,0,0.02)]" 
                                      : "bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-50 top-1"
                                    }
                                    ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                            >
                                {region}
                            </button>
                          )
                      ))}
                  </div>
                  <div className="h-px bg-white w-full z-0 relative -mt-px"></div>
              </div>
          )}

          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2"><Layers size={14} /> Daftar Item</h3>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">{pages.reduce((acc, p) => acc + p.items.length, 0)} Items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {loading ? (<div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center gap-2"><Loader2 className="animate-spin"/> Memuat data...</div>) : (
                pages.flatMap(page => page.items.map((item: EditorItem) => (
                    <div 
                        key={`sidebar-${item.id}`} 
                        draggable={true} 
                        onDragStart={(e) => handleSidebarDragStart(e, item)} 
                        onClick={() => scrollToItem(item, page.id)} 
                        className={`
                            flex gap-3 p-2 rounded-lg border cursor-pointer transition-all select-none group relative
                            ${selectedItemId === item.id ? "bg-blue-50 border-blue-400 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"}
                        `}
                    >
                        <div className="w-12 h-12 bg-white rounded border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={generatedBadges[item.id] || item.content?.image_url || "/assets/placeholder.png"} className="w-10 h-10 object-contain mix-blend-multiply" />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center flex-1">
                            <p className="text-xs font-bold text-slate-700 truncate">{item.content?.name || "Tanpa Nama"}</p>
                            <p className="text-[10px] font-mono text-blue-600 font-bold mt-1 truncate">{item.content?.price_display}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Pg {page.pageNumber}</span>
                                {item.content?.show_coret && <span className="text-[9px] text-red-500 font-bold line-through">{item.content.txt_coret}</span>}
                            </div>
                        </div>
                    </div>
                )))
            )}
            {!loading && pages.length > 0 && pages.every(p => p.items.length === 0) && (
                <div className="text-center py-10 text-slate-400 text-xs">
                    Belum ada item di wilayah <b>{activeRegion}</b>.
                </div>
            )}
          </div>
        </aside>
        
        <main className="flex-1 relative flex flex-col min-w-0 overflow-auto items-center py-10 bg-slate-200/50" ref={mainContainerRef}>
          {isDownloading && (
              <div className="absolute inset-0 bg-slate-900/50 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                      <Loader2 size={40} className="animate-spin text-blue-600" />
                      <div className="text-center">
                          <h3 className="font-bold text-lg text-slate-800">Sedang Memproses...</h3>
                          <p className="text-slate-500 text-sm">{downloadProgress}</p>
                      </div>
                  </div>
              </div>
          )}
          {!loading && pages.map((page: PageWithDimensions) => (
              <div key={page.id} className="group flex flex-col gap-2 items-center mb-10">
                <div className="flex items-center justify-between px-2 transition-all select-none" style={{ width: (page.width || 2480) * zoom }}>
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded shadow-sm border border-slate-200">Halaman {page.pageNumber}</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-100">{activeRegion}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDuplicatePage(page.id)} className="p-1.5 bg-white hover:text-blue-600 rounded shadow-sm border text-slate-500" title="Duplicate Page"><Copy size={14} /></button>
                    <button onClick={() => handleDeletePage(page.id)} className="p-1.5 bg-white hover:text-red-600 rounded shadow-sm border text-slate-500" title="Delete Page"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ width: (page.width || 2480) * zoom, height: (page.height || 3508) * zoom, position: "relative" }} className="bg-white shadow-2xl transition-all duration-200 ease-out">
                  <div ref={(el) => { pageRefs.current[page.id] = el; }} className={`bg-white overflow-hidden origin-top-left absolute top-0 left-0 ${selectedPageId === page.id ? "ring-4 ring-blue-500/20" : ""}`} onDragOver={handleCanvasDragOver} onDrop={(e) => handleCanvasDrop(e, page.id)} onClick={() => setSelectedPageId(page.id)} style={{ width: `${page.width || 2480}px`, height: `${page.height || 3508}px`, transform: `scale(${zoom})`, transformOrigin: 'top left', backgroundImage: pageBackground ? `url(${pageBackground})` : undefined, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}>
                    <RenderStaticLayout layoutData={page.pageNumber === 1 ? LAYOUT_COVER : LAYOUT_INNER} pageBackground={pageBackground} />
                    {isGridEnabled && <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 divide-x divide-y divide-blue-500/20 pointer-events-none z-50 border border-blue-500/20">{[...Array(16)].map((_, i) => <div key={i}></div>)}</div>}
                    {page.items.map((item: EditorItem) => (
                      <div key={item.id} onMouseDown={(e) => handleMouseDown(e, item, page.id)} className={`absolute select-none group/item cursor-move flex flex-col ${selectedItemId === item.id ? "ring-2 ring-blue-500 z-40 shadow-xl" : "hover:ring-1 hover:ring-blue-300 z-10"}`} style={{ left: item.layout.x, top: item.layout.y, width: item.layout.w, height: item.layout.h }}>
                          {item.type === 'product_card' ? (
                                generatedBadges[item.id] ? (
                                    <img src={generatedBadges[item.id]} className="w-full h-full object-contain" alt={item.content?.name} draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 border border-slate-200 flex flex-col items-center justify-center animate-pulse">
                                        <Loader2 className="animate-spin text-slate-300 mb-2" />
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
          <div className="transition-all pb-20" style={{ width: (currentPage?.width || 2480) * zoom }}>
            <button onClick={handleAddPage} className="group flex items-center justify-center gap-3 w-full py-8 bg-slate-200/50 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl transition-all text-slate-500"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20} /></div><span className="font-bold">Tambah Halaman</span></button>
          </div>
        </main>
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-sm z-10 shrink-0">
          <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2"><MousePointer2 size={14} /> Properti</h3></div>
          <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50">
            {activeItem ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="space-y-1"><label htmlFor="item_name" className="text-[10px] font-bold text-slate-400 uppercase">Nama Produk</label><input id="item_name" type="text" className="w-full text-xs border border-slate-300 rounded p-2 bg-white" value={activeItem.content?.name ?? ""} onChange={(e) => updateItemContent('name', e.target.value)} /></div>
                <div className="space-y-1"><label htmlFor="item_price" className="text-[10px] font-bold text-slate-400 uppercase">Harga Tampil</label><input id="item_price" type="text" className="w-full text-xs border border-slate-300 rounded p-2 bg-white" value={activeItem.content?.price_display ?? ""} onChange={(e) => updateItemContent('price_display', e.target.value)} /></div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ganti Gambar Produk</label>
                    <button onClick={handleOpenBankGambar} className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-xs font-medium text-slate-700 bg-white hover:bg-slate-50">
                        <FolderOpen className="w-4 h-4 mr-2" /> Ganti dari Bank Gambar
                    </button>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Komponen Badge</h4>
                    <button onClick={() => refreshBadge(activeItem)} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center justify-center gap-2 mb-2"><RefreshCw size={14} /> Refresh Gambar</button>
                    
                    <div className="flex items-center justify-between"><span className="text-xs text-slate-600">Harga Coret</span><button onClick={() => toggleBooleanProperty('show_coret')} className={`text-slate-400 hover:text-blue-600 ${activeItem.content?.show_coret ? 'text-blue-600' : ''}`}>{activeItem.content?.show_coret ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}</button></div>
                    {activeItem.content?.show_coret && (
                        <div className="space-y-1 ml-2 pl-2 border-l-2 border-slate-200">
                             <div className="space-y-1"><label className="text-[9px] text-slate-400">Harga Asli</label><input type="text" className="w-full text-xs border p-2 rounded" value={(activeItem.content?.txt_coret as string) ?? ""} onChange={(e) => updateItemContent('txt_coret', e.target.value)} /></div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-600">Keterangan / Promo</span>
                        <button onClick={() => toggleBooleanProperty('show_keterangan')} className={`text-slate-400 hover:text-blue-600 ${activeItem.content?.show_keterangan ? 'text-blue-600' : ''}`}>
                            {activeItem.content?.show_keterangan ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                    {activeItem.content?.show_keterangan && (
                        <div className="space-y-1 ml-2 pl-2 border-l-2 border-slate-200">
                             <input type="text" className="w-full text-xs border p-2 rounded" value={(activeItem.content?.txt_keterangan as string) ?? ""} onChange={(e) => updateItemContent('txt_keterangan', e.target.value)} />
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-600 font-bold">Label Promo</span>
                        <button onClick={() => toggleBadge('badge_promo')} className={`text-slate-400 hover:text-blue-600 ${((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_promo)?.active ? 'text-blue-600' : ''}`}>
                            {((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_promo)?.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                    {((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_promo)?.active && (
                        <div className="grid grid-cols-1 gap-2 pl-2 border-l-2 border-yellow-100 mb-2">
                            <input type="text" placeholder="Qty" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_promo).txt_qty_promo || ""} onChange={(e) => updateNestedContent('badge_promo', 'txt_qty_promo', e.target.value)} />
                            <input type="text" placeholder="Harga/Ket" className="w-full text-xs border p-1 rounded font-bold" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_promo).txt_price_promo || ""} onChange={(e) => updateNestedContent('badge_promo', 'txt_price_promo', e.target.value)} />
                             <input type="text" placeholder="Ket Bawah" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_promo).txt_keterangan_promo || ""} onChange={(e) => updateNestedContent('badge_promo', 'txt_keterangan_promo', e.target.value)} />
                             <input type="text" placeholder="Satuan" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_promo).txt_satuan || ""} onChange={(e) => updateNestedContent('badge_promo', 'txt_satuan', e.target.value)} />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100"><span className="text-xs text-slate-600">Badge BBMU</span><button onClick={() => toggleBooleanProperty('is_bbmu')} className={`text-slate-400 hover:text-blue-600 ${((activeItem.content as unknown as Record<string, boolean>).is_bbmu) ? 'text-blue-600' : ''}`}>{((activeItem.content as unknown as Record<string, boolean>).is_bbmu) ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}</button></div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-purple-600">Poin IGR</span>
                        <button onClick={() => toggleBadge('badge_igr')} className={`text-slate-400 hover:text-purple-600 ${((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_igr)?.active ? 'text-purple-600' : ''}`}>
                            {((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_igr)?.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                    {((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_igr)?.active && (
                         <div className="grid grid-cols-1 gap-2 pl-2 border-l-2 border-purple-100 mb-2">
                                <input type="text" placeholder="Ket. Qty" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_igr).txt_keterangan_qty_igr || ""} onChange={(e) => updateNestedContent('badge_igr', 'txt_keterangan_qty_igr', e.target.value)} />
                                <input type="text" placeholder="Satuan" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_igr).txt_satuan_igr || ""} onChange={(e) => updateNestedContent('badge_igr', 'txt_satuan_igr', e.target.value)} />
                                <input type="text" placeholder="Bonus" className="w-full text-xs border p-1 rounded font-bold" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_igr).txt_price_bonus_igr || ""} onChange={(e) => updateNestedContent('badge_igr', 'txt_price_bonus_igr', e.target.value)} />
                         </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-orange-600">Poin SPI</span>
                        <button onClick={() => toggleBadge('badge_spi')} className={`text-slate-400 hover:text-orange-600 ${((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_spi)?.active ? 'text-orange-600' : ''}`}>
                            {((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_spi)?.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                    {((activeItem.content as unknown as Record<string, { active?: boolean }>).badge_spi)?.active && (
                         <div className="grid grid-cols-1 gap-2 pl-2 border-l-2 border-orange-100">
                                <input type="text" placeholder="Ket. Qty" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_spi).txt_keterangan_qty_spi || ""} onChange={(e) => updateNestedContent('badge_spi', 'txt_keterangan_qty_spi', e.target.value)} />
                                <input type="text" placeholder="Satuan" className="w-full text-xs border p-1 rounded" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_spi).txt_satuan_spi || ""} onChange={(e) => updateNestedContent('badge_spi', 'txt_satuan_spi', e.target.value)} />
                                <input type="text" placeholder="Bonus" className="w-full text-xs border p-1 rounded font-bold" value={((activeItem.content as unknown as Record<string, Record<string, string>>).badge_spi).txt_price_bonus_spi || ""} onChange={(e) => updateNestedContent('badge_spi', 'txt_price_bonus_spi', e.target.value)} />
                         </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200">
                  <div className="space-y-1"><label htmlFor="pos_x" className="text-[10px] font-bold text-slate-400 uppercase">X</label><input id="pos_x" type="text" className="w-full text-xs border border-slate-300 rounded p-2 font-mono" value={Math.round(activeItem.layout.x)} readOnly /></div>
                  <div className="space-y-1"><label htmlFor="pos_y" className="text-[10px] font-bold text-slate-400 uppercase">Y</label><input id="pos_y" type="text" className="w-full text-xs border border-slate-300 rounded p-2 font-mono" value={Math.round(activeItem.layout.y)} readOnly /></div>
                  <div className="space-y-1"><label htmlFor="pos_w" className="text-[10px] font-bold text-slate-400 uppercase">W</label><input id="pos_w" type="text" className="w-full text-xs border border-slate-300 rounded p-2 font-mono" value={Math.round(activeItem.layout.w)} readOnly /></div>
                  <div className="space-y-1"><label htmlFor="pos_h" className="text-[10px] font-bold text-slate-400 uppercase">H</label><input id="pos_h" type="text" className="w-full text-xs border border-slate-300 rounded p-2 font-mono" value={Math.round(activeItem.layout.h)} readOnly /></div>
                </div>
                <div className="pt-4 border-t border-slate-200"><button onClick={handleDeleteItem} className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={14} /> Hapus Item</button></div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                    <p className="text-xs">Belum ada elemen yang dipilih</p>
                    {hasEmptySlot && (
                        <button 
                            onClick={handleAddDummyProduct}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                            <PlusSquare size={16} /> Tambah Produk Manual
                        </button>
                    )}
                </div>
            )}
          </div>
        </aside>
      </div>

      <ProductUploadModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        productToEdit={productToEdit}
      />

      {showCalcModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="text-lg font-bold">Perhitungan Algoritma Apriori</h2>
                <p className="text-xs text-slate-300 mt-1">
                    Dihitung berdasarkan {aprioriData.totalTransactions} transaksi historis 
                    (Min. Support: {(aprioriData.steps?.min_support || 0.01) * 100}%, Min. Confidence: {(aprioriData.steps?.min_confidence || 0.1) * 100}%)
                </p>
              </div>
              <button onClick={() => setShowCalcModal(false)} className="text-slate-300 hover:text-red-400 text-2xl font-bold transition-colors">&times;</button>
            </div>

            <div className="p-0 overflow-y-auto flex-1 bg-white">
                  <table className="min-w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                      <tr className="text-slate-700 text-xs border-b border-slate-200 uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Aturan (Rule)</th>
                        <th className="py-3 px-4 font-bold text-center">Support (AUB)</th>
                        <th className="py-3 px-4 font-bold text-center">Confidence</th>
                        <th className="py-3 px-4 font-bold text-center">Lift Ratio</th>
                        <th className="py-3 px-4 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-700">
                        {aprioriData.steps?.rules_calculation && aprioriData.steps.rules_calculation.length > 0 ? (
                            aprioriData.steps.rules_calculation.map((r: AprioriStepRule, i: number) => (
                                <tr key={i} className={`border-b transition-colors ${r.is_valid ? 'border-slate-100 hover:bg-slate-50' : 'bg-red-50/30 border-red-100 text-slate-500'}`}>
                                    <td className="py-3 px-4 font-bold">{r.rule}</td>
                                    <td className="py-3 px-4 text-center font-mono">{(r.support_A_B * 100).toFixed(1)}%</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">{(r.confidence * 100).toFixed(1)}%</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-purple-600">{r.lift_ratio.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-center">
                                        {r.is_valid 
                                            ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700">Valid</span>
                                            : <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700">Tidak Valid</span>
                                        }
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <p className="text-slate-500 font-medium">Belum ada aturan yang memenuhi syarat minimum support.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                  </table>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
              <button onClick={() => setShowCalcModal(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors shadow-sm active:scale-95">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;grif 