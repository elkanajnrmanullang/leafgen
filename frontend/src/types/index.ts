export interface BadgePromo {
  active: boolean;
  txt_qty_promo: string;
  txt_price_promo: string;
  txt_keterangan_promo?: string;
  txt_satuan?: string;
}

export interface BadgeIGR {
  active: boolean;
  txt_keterangan_qty_igr: string;
  txt_satuan_igr: string;
  txt_price_bonus_igr: string;
}

export interface BadgeSPI {
    active: boolean;
    txt_price_bonus_spi: string;
    txt_satuan_spi: string;
    txt_keterangan_qty_spi: string;
}

export interface ItemContent {
  // Core Product Data
  name: string;
  price_display: string | number;
  image_url?: string;
  img_product?: string; 

  // --- Toggle Flags & Data ---
  
  // 1. Harga Coret
  show_coret?: boolean;
  price_original?: number;
  txt_coret?: string;

  // 2. Keterangan
  show_keterangan?: boolean;
  txt_keterangan?: string;

  // 3. BBMU
  is_bbmu?: boolean;
  badge_bbmu_url?: string | null;

  // 4. Promo
  badge_promo?: BadgePromo | null;
  img_bg_label_promo?: string | null;
  
  // 5. IGR
  badge_igr?: BadgeIGR | null;
  
  // 6. SPI
  badge_spi?: BadgeSPI | null;

  // Raw text fallback (optional)
  txt_price_bonus_spi?: string;
  txt_satuan_spi?: string;
  txt_keterangan_qty_spi?: string;
  txt_satuan_price?: string;
  
  [key: string]: unknown;
}

export interface EditorItem {
  id: string;
  plu?: string;
  type?: string;
  component_name?: string;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  content?: ItemContent;
  needs_manual_image?: boolean;
}

export interface LeafletPage {
  id: string;
  pageNumber: number;
  width?: number;
  height?: number;
  items: EditorItem[];
}

export interface BackendItem {
  id: string;
  type: string;
  plu: string;
  component_name?: string;
  content: ItemContent;
  needs_manual_image: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BackendPage {
  id: string;
  page_number: number;
  items: BackendItem[];
}

export interface BackendLeafletResponse {
  leaflet_name: string;
  store: string;
  pages: BackendPage[];
  id?: string;
}