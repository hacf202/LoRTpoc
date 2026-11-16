import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { matchSearchQuery, rankSearchResults } from '../utils/searchUtils.js';
import { paginateList } from '../utils/paginate.js';
import { relationService } from './relation.service.js';
import { loadCollectionFromDb } from '../config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const relicsFilePath = path.join(__dirname, '../data/relics.json');

let relics = [];
try {
  relics = JSON.parse(fs.readFileSync(relicsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load relics:', err.message);
}

const relicMap = new Map();
relics.forEach((r) => {
  if (r.relicCode) relicMap.set(r.relicCode, r);
});

export const relicService = {
  loadFromDb: async () => {
    const data = await loadCollectionFromDb('relics', 'relics.json');
    if (Array.isArray(data) && data.length > 0) {
      relics = data;
      relicMap.clear();
      relics.forEach((r) => {
        if (r.relicCode) relicMap.set(r.relicCode, r);
      });
      console.log(`[RelicService] Loaded ${relics.length} relics from MongoDB.`);
    }
    return relics;
  },

  getAll: async (filter = {}) => {
    let result = [...relics];

    if (filter.search) {
      const q = filter.search.trim();
      if (q) {
        result = rankSearchResults(result, q, (r) => ({
          nameVi: r.name || '',
          nameEn: r.translations?.en?.name || '',
          code: r.relicCode || '',
          desc: r.descriptionRaw || r.description || ''
        }));
      }
    }

    if (filter.rarity) {
      const rKey = filter.rarity.toLowerCase().trim();
      const rarities = rKey.split(',').map((s) => s.trim()).filter(Boolean);
      result = result.filter((r) => {
        const viRarity = r.rarity?.toLowerCase() || '';
        const enRarity = r.translations?.en?.rarity?.toLowerCase() || '';
        return rarities.some((target) => {
          if (target === 'common' || target === 'thường') return viRarity.includes('thường') || enRarity.includes('common');
          if (target === 'rare' || target === 'hiếm') return viRarity.includes('hiếm') || enRarity.includes('rare');
          if (target === 'epic' || target === 'sử thi') return viRarity.includes('sử thi') || viRarity.includes('su thi') || enRarity.includes('epic');
          return viRarity.includes(target) || enRarity.includes(target);
        });
      });
    }

    if (filter.type) {
      const typeKeys = filter.type.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      result = result.filter((r) => {
        const relicTypes = (Array.isArray(r.type) ? r.type : [r.type || 'Chung']).map((t) => String(t).toLowerCase());
        return typeKeys.some((target) => relicTypes.some((t) => t.includes(target)));
      });
    }

    if (filter.sort) {
      const sortBy = filter.sort;
      const isDefaultSort = sortBy === 'name-asc';
      if (!filter.search || !isDefaultSort) {
        result.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
          if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
          if (sortBy === 'rarity-desc') {
            const rank = { common: 1, 'thường': 1, rare: 2, 'hiếm': 2, epic: 3, 'sử thi': 3, legendary: 4, 'huyền thoại': 4 };
            const rA = rank[(a.rarity || '').toLowerCase()] || 0;
            const rB = rank[(b.rarity || '').toLowerCase()] || 0;
            return rB - rA;
          }
          if (sortBy === 'rarity-asc') {
            const rank = { common: 1, 'thường': 1, rare: 2, 'hiếm': 2, epic: 3, 'sử thi': 3, legendary: 4, 'huyền thoại': 4 };
            const rA = rank[(a.rarity || '').toLowerCase()] || 0;
            const rB = rank[(b.rarity || '').toLowerCase()] || 0;
            return rA - rB;
          }
          return 0;
        });
      }
    }

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'relicCode');
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
        hasMore: false
      }
    };
  },

  getByCode: async (code, fields = null) => {
    const cleanCode = String(code).toLowerCase().trim();
    const relic = relics.find(
      (r) =>
        r.relicCode?.toLowerCase() === cleanCode ||
        r.name?.toLowerCase() === cleanCode ||
        r.translations?.en?.name?.toLowerCase() === cleanCode
    ) || null;

    if (!relic) return null;

    const targetCode = relic.relicCode;
    const refData = relationService.getRelicReferences(targetCode);

    const enriched = {
      ...relic,
      compatibleChampions: refData.compatibleChampions,
      totalChampions: refData.totalChampions,
      companionRelicsMap: refData.companionRelicsMap
    };

    return fields ? pickFields(enriched, fields, 'relicCode') : enriched;
  }
};
