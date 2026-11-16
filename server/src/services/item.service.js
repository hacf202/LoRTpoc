import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { rankSearchResults } from '../utils/searchUtils.js';
import { paginateList } from '../utils/paginate.js';
import { loadCollectionFromDb } from '../config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsFilePath = path.join(__dirname, '../data/items.json');
const championsFilePath = path.join(__dirname, '../data/champions.json');

let items = [];
try {
  items = JSON.parse(fs.readFileSync(itemsFilePath, 'utf8'));
} catch (err) {
  console.error('[Item Service] Failed to load items:', err.message);
  items = [];
}

let champions = [];
try {
  champions = JSON.parse(fs.readFileSync(championsFilePath, 'utf8'));
} catch (err) {
  console.error('[Item Service] Failed to load champions:', err.message);
  champions = [];
}

export const itemService = {
  loadFromDb: async () => {
    const data = await loadCollectionFromDb('items', 'items.json');
    if (Array.isArray(data) && data.length > 0) {
      items = data;
      console.log(`[ItemService] Loaded ${items.length} items from MongoDB.`);
    }
    const champData = await loadCollectionFromDb('champions', 'champions.json');
    if (Array.isArray(champData) && champData.length > 0) {
      champions = champData;
    }
    return items;
  },

  getAll: async (filter = {}) => {
    let result = [...items];

    if (filter.search) {
      const q = filter.search.trim();
      if (q) {
        result = rankSearchResults(result, q, (item) => ({
          nameVi: item.name || '',
          nameEn: item.translations?.en?.name || '',
          code: item.itemCode || '',
          desc: item.descriptionRaw || item.description || ''
        }));
      }
    }

    // Support multi-select rarity (OR logic)
    if (filter.rarity && filter.rarity !== 'all') {
      const rKey = filter.rarity.toLowerCase().trim();
      const rarities = rKey.split(',').map((s) => s.trim()).filter(Boolean);
      result = result.filter((item) => {
        const viRarity = (item.rarity || '').toLowerCase();
        const enRarity = (item.translations?.en?.rarity || '').toLowerCase();
        return rarities.some((target) => {
          if (target === 'common' || target === 'thường') return viRarity.includes('thường') || enRarity.includes('common');
          if (target === 'rare' || target === 'hiếm') return viRarity.includes('hiếm') || enRarity.includes('rare');
          if (target === 'epic' || target === 'sử thi') return viRarity.includes('sử thi') || enRarity.includes('epic');
          if (target === 'special' || target === 'đặc biệt') return viRarity.includes('đặc biệt') || enRarity.includes('special');
          return viRarity.includes(target) || enRarity.includes(target);
        });
      });
    }

    // Support multi-select type (OR logic)
    if (filter.type && filter.type !== 'all') {
      const typeList = filter.type
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      result = result.filter((item) => {
        const itemTypes = (Array.isArray(item.type) ? item.type : []).map((t) => (t || '').toLowerCase());
        return typeList.some((targetType) =>
          itemTypes.some((t) => t.includes(targetType) || targetType.includes(t))
        );
      });
    }

    const sortMode = filter.sort || 'rarity-desc';
    const rarityScore = (r) => {
      const s = (r || '').toLowerCase();
      if (s.includes('epic') || s.includes('sử thi')) return 4;
      if (s.includes('rare') || s.includes('hiếm')) return 3;
      if (s.includes('common') || s.includes('thường')) return 2;
      if (s.includes('special') || s.includes('đặc biệt')) return 1;
      return 0;
    };

    if (sortMode === 'rarity-desc') {
      result.sort((a, b) => {
        const diff = rarityScore(b.rarity) - rarityScore(a.rarity);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '');
      });
    } else if (sortMode === 'rarity-asc') {
      result.sort((a, b) => {
        const diff = rarityScore(a.rarity) - rarityScore(b.rarity);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '');
      });
    } else if (sortMode === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortMode === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'itemCode');
    }

    if (filter.page || (filter.limit && filter.limit !== 'all')) {
      return paginateList(result, filter);
    }

    return {
      data: result,
      pagination: {
        page: 1,
        limit: result.length,
        total: result.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  },

  getById: async (id, fields) => {
    const target = String(id).toLowerCase().trim();
    const item = items.find(
      (i) =>
        (i.itemCode && i.itemCode.toLowerCase() === target) ||
        (i.name && i.name.toLowerCase() === target) ||
        (i.translations?.en?.name && i.translations.en.name.toLowerCase() === target)
    );

    if (!item) return null;

    const targetCode = item.itemCode;
    const compatibleChampions = [];

    for (const c of champions) {
      const isRecommended = Array.isArray(c.itemIds) && c.itemIds.includes(targetCode);

      const deckCards = [];
      if (c.startingDeck?.baseCards && Array.isArray(c.startingDeck.baseCards)) {
        for (const card of c.startingDeck.baseCards) {
          if (Array.isArray(card.itemCodes)) {
            const foundItem = card.itemCodes.find((ic) => {
              if (typeof ic === 'string') return ic === targetCode;
              return ic.itemCode === targetCode;
            });
            if (foundItem) {
              deckCards.push({
                cardCode: card.cardCode,
                unlockLevel: typeof foundItem === 'object' ? foundItem.unlockLevel : null
              });
            }
          }
        }
      }

      const isDeck = deckCards.length > 0;

      if (isRecommended || isDeck) {
        compatibleChampions.push({
          championID: c.championID || c.cardCode || '',
          name: c.name || '',
          cardCode: c.cardCode || '',
          assets: c.assets || null,
          regions: c.regions || [],
          tier: c.tier || '',
          maxStar: c.maxStar || 3,
          cost: c.cost || 0,
          translations: c.translations || null,
          isRecommended,
          isDeck,
          deckCards
        });
      }
    }

    // Recommended first, then deck attachments, then alphabetically
    compatibleChampions.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
      if (a.isDeck !== b.isDeck) return a.isDeck ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const enriched = {
      ...item,
      compatibleChampions,
      totalChampions: compatibleChampions.length
    };

    return fields ? pickFields(enriched, fields, 'itemCode') : enriched;
  }
};
