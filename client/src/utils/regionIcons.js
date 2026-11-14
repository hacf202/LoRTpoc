/**
 * Region Icons Mapping for Legends of Runeterra
 * Local asset paths in client/public/icons/regions/ for instantaneous, reliable loading.
 */
export const REGION_ICONS = {
  bandlecity: '/icons/regions/bandlecity.webp',
  bilgewater: '/icons/regions/bilgewater.webp',
  demacia: '/icons/regions/demacia.webp',
  freljord: '/icons/regions/freljord.webp',
  ionia: '/icons/regions/ionia.webp',
  noxus: '/icons/regions/noxus.webp',
  piltoverzaun: '/icons/regions/piltoverzaun.webp',
  runeterra: '/icons/regions/runeterra.webp',
  shadowisles: '/icons/regions/shadowisles.webp',
  shurima: '/icons/regions/shurima.webp',
  spiritblossom: '/icons/regions/spiritblossom.webp',
  targon: '/icons/regions/targon.webp'
};

export const CDN_REGION_ICONS = {
  bandlecity: 'https://images.lortpoc.com/icon/Bandle_City_LoR_Region.webp',
  bilgewater: 'https://images.lortpoc.com/icon/Bilgewater_LoR_Region.webp',
  demacia: 'https://images.lortpoc.com/icon/Demacia_LoR_Region.webp',
  freljord: 'https://images.lortpoc.com/icon/Freljord_LoR_Region.webp',
  ionia: 'https://images.lortpoc.com/icon/Ionia_LoR_Region.webp',
  noxus: 'https://images.lortpoc.com/icon/Noxus_LoR_Region.webp',
  piltoverzaun: 'https://images.lortpoc.com/icon/Piltover_Zaun_LoR_Region.webp',
  runeterra: 'https://images.lortpoc.com/icon/Runeterra_LoR_Region.webp',
  shadowisles: 'https://images.lortpoc.com/icon/Shadow_Isles_LoR_Region.webp',
  shurima: 'https://images.lortpoc.com/icon/Shurima_LoR_Region.webp',
  spiritblossom: 'https://images.lortpoc.com/icon/Spirit_Blossom_LoR_Region.webp',
  targon: 'https://images.lortpoc.com/icon/Targon_LoR_Region.webp'
};

const REGION_ALIAS_MAP = {
  'thanh pho bandle': 'bandlecity',
  'thanhphobandle': 'bandlecity',
  'bandle city': 'bandlecity',
  'bandlecity': 'bandlecity',
  'quan dao bong dem': 'shadowisles',
  'quandaobongdem': 'shadowisles',
  'shadow isles': 'shadowisles',
  'shadowisles': 'shadowisles',
  'hoa linh luc dia': 'spiritblossom',
  'hoalinhlucdia': 'spiritblossom',
  'spirit blossom': 'spiritblossom',
  'spiritblossom': 'spiritblossom',
  'piltover & zaun': 'piltoverzaun',
  'piltover and zaun': 'piltoverzaun',
  'piltoverzaun': 'piltoverzaun',
  'trung lap': 'runeterra',
  'trunglap': 'runeterra',
  'runeterra': 'runeterra'
};

export const getRegionIconUrl = (regionKey) => {
  if (!regionKey) return null;

  // 1. Remove Vietnamese accents and normalize string
  const normalized = String(regionKey)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

  // 2. Check full alias map
  if (REGION_ALIAS_MAP[normalized]) {
    return REGION_ICONS[REGION_ALIAS_MAP[normalized]] || null;
  }

  // 3. Check stripped characters alias map
  const clean = normalized.replace(/[^a-z]/g, '');
  if (REGION_ALIAS_MAP[clean]) {
    return REGION_ICONS[REGION_ALIAS_MAP[clean]] || null;
  }

  // 4. Check direct key in REGION_ICONS
  return REGION_ICONS[clean] || null;
};

/**
 * Bilingual Tag Translations (VI & EN)
 */
export const TAG_TRANSLATIONS = {
  'Control': { vi: 'Kiểm Soát', en: 'Control' },
  'Aggro': { vi: 'Tấn Công Nhanh', en: 'Aggro' },
  'Combo': { vi: 'Phối Hợp', en: 'Combo' },
  'Midrange': { vi: 'Tầm Trung', en: 'Midrange' },
  'Spells': { vi: 'Bài Phép', en: 'Spells' },
  'Swarm': { vi: 'Tràn Bàn', en: 'Swarm' },
  'Tech': { vi: 'Công Nghệ', en: 'Tech' },
  'Creation': { vi: 'Sinh Bài', en: 'Creation' },
  'Buff Stat': { vi: 'Tăng Chỉ Số', en: 'Buff Stat' },
  'Infinite Value': { vi: 'Tài Nguyên Vô Hạn', en: 'Infinite Value' },
  '6 Sao Ko Skin': { vi: '6 Sao Không Skin', en: '6-Star No Skin' },
  'Balance': { vi: 'Cân Bằng', en: 'Balance' },
  'Overwhelm': { vi: 'Áp Đảo', en: 'Overwhelm' },
  'Elusive': { vi: 'Tàng Hình', en: 'Elusive' },
  'Rally': { vi: 'Tập Hợp', en: 'Rally' },
  'Stun': { vi: 'Làm Choáng', en: 'Stun' },
  'Frostbite': { vi: 'Đóng Băng', en: 'Frostbite' }
};

export const getTagLabel = (tag, lang = 'vi') => {
  if (!tag) return '';
  const match = TAG_TRANSLATIONS[tag];
  if (match) {
    return lang === 'en' ? match.en : match.vi;
  }
  return tag;
};
