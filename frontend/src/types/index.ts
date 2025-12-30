export interface BadgePromo {
  active: boolean;
  txt_qty_promo: string;
  txt_price_promo: string;
}

export interface BadgeIGR {
  active: boolean;
  txt_keterangan_qty_igr: string;
  txt_satuan_igr: string;
  txt_price_bonus_igr: string;
}

export interface ItemContent {
  name: string;
  price_display: string | number;
  price_original?: number;
  show_coret?: boolean;
  description?: string;
  image_url?: string;
  is_bbmu?: boolean;
  badge_bbmu_url?: string | null;
  badge_promo_url?: string | null;
  badge_igr_url?: string | null;
  badge_spi_url?: string | null;
  badge_promo?: BadgePromo | null;
  badge_igr?: BadgeIGR | null;
  badge_spi_value?: number;
}

export interface EditorItem {
  id: string;
  plu?: string;
  type?: string;
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
  items: EditorItem[];
}

export interface BackendItem {
  id: string;
  type: string;
  plu: string;
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
