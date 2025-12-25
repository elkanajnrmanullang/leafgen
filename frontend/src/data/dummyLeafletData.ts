export interface LeafletItemComponent {
  badge_promo?: {
    active: boolean;
    txt_qty_promo: string;
    txt_price_promo: string;
  };
  badge_igr?: {
    active: boolean;
    txt_keterangan_qty_igr: string;
    txt_satuan_igr: string;
    txt_price_bonus_igr: string;
  };
  badge_spi?: {
    active: boolean;
    value: string;
  };
  badge_bbmu?: {
    active: boolean;
  };
}

export interface LeafletItem {
  id: string;
  plu: string;
  name: string;
  price_display: string;
  price_coret?: string;
  show_coret: boolean;
  keterangan?: string;
  image_url: string;
  manual_upload_needed: boolean;
  components: LeafletItemComponent;
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export const DUMMY_RESPONSE = {
  status: "success",
  meta: {
    region: "BALI",
    total_items: 4,
    template_id: 1,
  },
  data: [
    {
      id: "item-1",
      plu: "1001",
      name: "MINYAK GORENG TROPICAL 2L",
      price_display: "Rp 32.500",
      price_coret: "Rp 45.000",
      show_coret: true,
      image_url: "https://placehold.co/400x400/png?text=Minyak+2L",
      manual_upload_needed: false,
      components: {
        badge_bbmu: { active: true },
      },
      layout: { x: 50, y: 350, w: 400, h: 400 },
    },
    {
      id: "item-2",
      plu: "2002",
      name: "SARI ROTI TAWAR SPESIAL",
      price_display: "Rp 12.000",
      show_coret: false,
      keterangan: "*Harga Setelah Potongan",
      image_url: "https://placehold.co/400x400/png?text=Roti+Tawar",
      manual_upload_needed: false,
      components: {
        badge_promo: {
          active: true,
          txt_qty_promo: "2",
          txt_price_promo: "Rp 20.000",
        },
      },
      layout: { x: 500, y: 350, w: 400, h: 400 },
    },
    {
      id: "item-3",
      plu: "3003",
      name: "INDOMIE GORENG 5 PCS",
      price_display: "Rp 15.000",
      show_coret: false,
      image_url: "https://placehold.co/400x400/png?text=Indomie",
      manual_upload_needed: false,
      components: {
        badge_igr: {
          active: true,
          txt_keterangan_qty_igr: "5",
          txt_satuan_igr: "Pcs",
          txt_price_bonus_igr: "500",
        },
      },
      layout: { x: 950, y: 350, w: 400, h: 400 },
    },
    {
      id: "item-4",
      plu: "4004",
      name: "SUSU ULTRA MILK 1L",
      price_display: "Rp 18.900",
      show_coret: false,
      image_url: "https://placehold.co/400x400/png?text=Susu+Ultra",
      manual_upload_needed: false,
      components: {
        badge_spi: {
          active: true,
          value: "1.000",
        },
      },
      layout: { x: 50, y: 800, w: 400, h: 400 },
    },
  ],
};
