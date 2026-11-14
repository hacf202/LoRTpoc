/**
 * Entity Preview Service & In-Memory Cache
 * Cung cấp dữ liệu tóm tắt và hình ảnh cho tooltip xem trước khi hover vào markup tags [cd:...], [p:...], [r:...], [i:...], [c:...]
 */

const previewCache = new Map();

function getFallbackImage(type, id) {
  const t = (type || '').toLowerCase();
  if (t === 'r') return `https://images.lortpoc.com/relics/${id}.webp`;
  if (t === 'p') return `https://images.lortpoc.com/powers/${id}.webp`;
  if (t === 'i') return `https://images.lortpoc.com/items/${id}.webp`;
  if (t === 'c') return `https://images.lortpoc.com/avatarChampions/${id}.webp`;
  return '';
}

function normalizeEntityData(type, id, raw, fallbackLabel = '') {
  const t = (type || '').toLowerCase();

  if (!raw) {
    return {
      type: t,
      id,
      name: fallbackLabel || id,
      nameEn: '',
      image: getFallbackImage(t, id),
      desc: '',
      rarity: '',
      cost: null
    };
  }

  if (t === 'cd') {
    return {
      type: 'cd',
      id: raw.cardCode || id,
      name: raw.cardName || fallbackLabel || id,
      nameEn: raw.translations?.en?.cardName || '',
      image: raw.gameAbsolutePath || raw.assetAbsolutePath || '',
      cost: raw.cost ?? null,
      rarity: raw.rarity || '',
      regions: raw.regions || [],
      subtypes: raw.subtypes || [],
      desc: raw.descriptionRaw || raw.description || ''
    };
  }

  if (t === 'p') {
    return {
      type: 'p',
      id: raw.powerCode || id,
      name: raw.name || fallbackLabel || id,
      nameEn: raw.translations?.en?.name || '',
      image: raw.image || raw.assetFullAbsolutePath || raw.assetAbsolutePath || `https://images.lortpoc.com/powers/${id}.webp`,
      rarity: raw.rarity || '',
      desc: raw.descriptionRaw || raw.description || ''
    };
  }

  if (t === 'r') {
    return {
      type: 'r',
      id: raw.relicCode || id,
      name: raw.name || fallbackLabel || id,
      nameEn: raw.translations?.en?.name || '',
      image: raw.image || raw.assetFullAbsolutePath || raw.assetAbsolutePath || `https://images.lortpoc.com/relics/${id}.webp`,
      rarity: raw.rarity || '',
      desc: raw.descriptionRaw || raw.description || ''
    };
  }

  if (t === 'i') {
    return {
      type: 'i',
      id: raw.itemCode || id,
      name: raw.name || fallbackLabel || id,
      nameEn: raw.translations?.en?.name || '',
      image: raw.image || raw.assetFullAbsolutePath || raw.assetAbsolutePath || `https://images.lortpoc.com/items/${id}.webp`,
      rarity: raw.rarity || '',
      desc: raw.descriptionRaw || raw.description || ''
    };
  }

  if (t === 'c') {
    return {
      type: 'c',
      id: raw.championID || raw.cardCode || id,
      name: raw.name || fallbackLabel || id,
      nameEn: raw.translations?.en?.name || '',
      image: raw.assets?.[0]?.avatar || raw.assets?.[0]?.gameAbsolutePath || `https://images.lortpoc.com/avatarChampions/${id}.webp`,
      cost: raw.cost ?? null,
      regions: raw.regions || [],
      tier: raw.tier ? raw.tier.split('//')[0].trim() : '',
      desc: raw.playstyle || ''
    };
  }

  if (t === 'm') {
    return {
      type: 'm',
      id: raw.adventureID || id,
      name: raw.adventureName || raw.name || fallbackLabel || id,
      nameEn: raw.translations?.en?.adventureName || '',
      image: raw.image || raw.banner || '',
      difficulty: raw.difficulty || '',
      desc: raw.description || ''
    };
  }

  return {
    type: t,
    id,
    name: fallbackLabel || id,
    nameEn: '',
    image: '',
    desc: ''
  };
}

/**
 * Lấy thông tin thực thể để hiển thị preview tooltip
 * Ưu tiên đọc từ cache ngay lập tức, nếu chưa có thì fetch nền
 */
export async function getEntityPreview(type, id, fallbackLabel = '') {
  if (!id) return null;
  const t = (type || '').toLowerCase();
  const key = `${t}:${id}`.toLowerCase();

  if (previewCache.has(key)) {
    return previewCache.get(key);
  }

  let data = null;
  try {
    let endpoint = '';
    if (t === 'cd') endpoint = `/api/v1/cards/${encodeURIComponent(id)}`;
    else if (t === 'p') endpoint = `/api/v1/powers/${encodeURIComponent(id)}`;
    else if (t === 'r') endpoint = `/api/v1/relics/${encodeURIComponent(id)}`;
    else if (t === 'i') endpoint = `/api/v1/items/${encodeURIComponent(id)}`;
    else if (t === 'c') endpoint = `/api/v1/champions/${encodeURIComponent(id)}`;
    else if (t === 'm') endpoint = `/api/v1/maps/${encodeURIComponent(id)}`;

    if (endpoint) {
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          data = json.data;
        }
      }
    }
  } catch (err) {
    console.debug('Preview fetch error:', err);
  }

  const normalized = normalizeEntityData(t, id, data, fallbackLabel);
  if (normalized) {
    previewCache.set(key, normalized);
  }
  return normalized;
}

/**
 * Lấy nhanh dữ liệu có sẵn từ cache (đồng bộ)
 */
export function getCachedEntityPreview(type, id) {
  if (!id) return null;
  const key = `${(type || '').toLowerCase()}:${id}`.toLowerCase();
  return previewCache.get(key) || null;
}
