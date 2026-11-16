import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { matchSearchQuery, rankSearchResults } from '../utils/searchUtils.js';
import { paginateList } from '../utils/paginate.js';
import { loadCollectionFromDb } from '../config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const powersFilePath = path.join(__dirname, '../data/powers.json');
const championsFilePath = path.join(__dirname, '../data/champions.json');

let powers = [];
try {
  powers = JSON.parse(fs.readFileSync(powersFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load powers dataset:', err.message);
}

let champions = [];
try {
  champions = JSON.parse(fs.readFileSync(championsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load champions in power service:', err.message);
}

export const powerService = {
  loadFromDb: async () => {
    const data = await loadCollectionFromDb('powers', 'powers.json');
    if (Array.isArray(data) && data.length > 0) {
      powers = data;
      console.log(`[PowerService] Loaded ${powers.length} powers from MongoDB.`);
    }
    const champData = await loadCollectionFromDb('champions', 'champions.json');
    if (Array.isArray(champData) && champData.length > 0) {
      champions = champData;
    }
    return powers;
  },

  getAll: async (filter = {}) => {
    let result = [...powers];

    if (filter.search) {
      const q = filter.search.trim();
      if (q) {
        result = rankSearchResults(result, q, (p) => ({
          nameVi: p.name || '',
          nameEn: p.translations?.en?.name || '',
          code: p.powerCode || '',
          desc: p.descriptionRaw || p.description || ''
        }));
      }
    }

    if (filter.rarity) {
      const rKey = filter.rarity.toLowerCase().trim();
      const rarities = rKey.split(',').map((s) => s.trim()).filter(Boolean);
      result = result.filter((p) => {
        const viRarity = (p.rarity || '').toLowerCase();
        const enRarity = (p.translations?.en?.rarity || '').toLowerCase();
        return rarities.some((target) => {
          if (target === 'common' || target === 'thường') return viRarity.includes('common') || viRarity.includes('thường') || enRarity.includes('common');
          if (target === 'rare' || target === 'hiếm') return viRarity.includes('rare') || viRarity.includes('hiếm') || enRarity.includes('rare');
          if (target === 'epic' || target === 'sử thi') return viRarity.includes('epic') || viRarity.includes('sử thi') || viRarity.includes('su thi') || enRarity.includes('epic');
          if (target === 'legendary' || target === 'huyền thoại') return viRarity.includes('legendary') || viRarity.includes('huyền thoại') || enRarity.includes('legendary');
          if (target === 'special' || target === 'đặc biệt' || target === 'dac biet') return viRarity.includes('special') || viRarity.includes('đặc biệt') || enRarity.includes('special');
          return viRarity.includes(target) || enRarity.includes(target);
        });
      });
    }

    if (filter.type) {
      const typeKeys = filter.type.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      result = result.filter((p) => {
        const powerTypes = (Array.isArray(p.type) ? p.type : [p.type || 'General Power']).map((t) => String(t).toLowerCase());
        return typeKeys.some((target) => powerTypes.some((t) => t.includes(target)));
      });
    }

    if (filter.codes) {
      const codeList = filter.codes.split(',').map((c) => c.toLowerCase().trim());
      result = result.filter((p) => codeList.includes(p.powerCode?.toLowerCase()));
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
            const rank = { common: 1, 'thường': 1, rare: 2, 'hiếm': 2, epic: 3, 'sử thi': 3, legendary: 4, 'huyền thoại': 4, special: 5, 'đặc biệt': 5 };
            const rA = rank[(a.rarity || '').toLowerCase()] || 0;
            const rB = rank[(b.rarity || '').toLowerCase()] || 0;
            return rB - rA;
          }
          if (sortBy === 'rarity-asc') {
            const rank = { common: 1, 'thường': 1, rare: 2, 'hiếm': 2, epic: 3, 'sử thi': 3, legendary: 4, 'huyền thoại': 4, special: 5, 'đặc biệt': 5 };
            const rA = rank[(a.rarity || '').toLowerCase()] || 0;
            const rB = rank[(b.rarity || '').toLowerCase()] || 0;
            return rA - rB;
          }
          return 0;
        });
      }
    }

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'powerCode');
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
    const power = powers.find(
      (p) =>
        p.powerCode?.toLowerCase() === cleanCode ||
        p.name?.toLowerCase() === cleanCode ||
        p.translations?.en?.name?.toLowerCase() === cleanCode
    ) || null;

    if (!power) return null;

    const targetCode = power.powerCode;
    const compatibleChampions = [];

    for (const c of champions) {
      const isStarPower =
        (Array.isArray(c.powerStarIds) && c.powerStarIds.includes(targetCode)) ||
        (Array.isArray(c.constellation?.nodes) && c.constellation.nodes.some((n) => n.powerCode === targetCode));

      const isAdventure =
        Array.isArray(c.adventurePowerIds) && c.adventurePowerIds.includes(targetCode);

      if (isStarPower || isAdventure) {
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
          isStarPower,
          isAdventure
        });
      }
    }

    // Sort champions: Star Power holders first, then Adventure Power, then alphabetically
    compatibleChampions.sort((a, b) => {
      if (a.isStarPower !== b.isStarPower) return a.isStarPower ? -1 : 1;
      if (a.isAdventure !== b.isAdventure) return a.isAdventure ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const enriched = {
      ...power,
      compatibleChampions,
      totalChampions: compatibleChampions.length
    };

    return fields ? pickFields(enriched, fields, 'powerCode') : enriched;
  }
};