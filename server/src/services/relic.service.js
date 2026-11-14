import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { matchSearchQuery, rankSearchResults } from '../utils/searchUtils.js';
import { paginateList } from '../utils/paginate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const relicsFilePath = path.join(__dirname, '../data/relics.json');
const championsFilePath = path.join(__dirname, '../data/champions.json');

let relics = [];
try {
  relics = JSON.parse(fs.readFileSync(relicsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load relics:', err.message);
}

let champions = [];
try {
  champions = JSON.parse(fs.readFileSync(championsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load champions in relic service:', err.message);
}

const relicMap = new Map();
relics.forEach((r) => {
  if (r.relicCode) relicMap.set(r.relicCode, r);
});

export const relicService = {
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
    const compatibleChampions = [];
    const companionRelicsMap = {};

    companionRelicsMap[targetCode] = {
      relicCode: relic.relicCode,
      name: relic.name,
      rarity: relic.rarity,
      type: relic.type,
      translations: relic.translations
    };

    for (const c of champions) {
      let isCore = false;
      let coreDescription = '';
      let isOption = false;
      const matchingSets = [];
      const companionCodesSet = new Set();

      // 1. Check coreRelics (can be array or object)
      if (c.coreRelics) {
        if (Array.isArray(c.coreRelics)) {
          if (c.coreRelics.includes(targetCode)) isCore = true;
          c.coreRelics.forEach((r) => typeof r === 'string' && companionCodesSet.add(r));
        } else if (typeof c.coreRelics === 'object') {
          const mandatory = Array.isArray(c.coreRelics.mandatory) ? c.coreRelics.mandatory : [];
          const options = (Array.isArray(c.coreRelics.options) ? c.coreRelics.options : []).flat();
          if (mandatory.includes(targetCode)) {
            isCore = true;
            coreDescription = c.coreRelics.description || '';
          }
          if (options.includes(targetCode)) {
            isOption = true;
            if (!coreDescription) coreDescription = c.coreRelics.description || '';
          }
          mandatory.forEach((r) => companionCodesSet.add(r));
          options.forEach((r) => companionCodesSet.add(r));
        }
      }

      // 2. Check otherRelicOptions
      if (Array.isArray(c.otherRelicOptions) && c.otherRelicOptions.includes(targetCode)) {
        isOption = true;
      }

      // 3. Normalize all sets from c.relicSets (supports both array-of-arrays and object sets)
      const allSets = (Array.isArray(c.relicSets) ? c.relicSets : [])
        .map((s, idx) => {
          if (Array.isArray(s)) {
            return {
              title: `Bộ ${idx + 1}`,
              recommendedStars: 3,
              items: s.filter((item) => typeof item === 'string'),
              description: '',
              videoLink: ''
            };
          }
          if (s && typeof s === 'object') {
            return {
              title: s.title || `Bộ ${idx + 1}`,
              recommendedStars: s.recommendedStars || 0,
              items: Array.isArray(s.items) ? s.items.filter((item) => typeof item === 'string') : [],
              description: s.description || '',
              videoLink: s.videoLink || '',
              translations: s.translations || null
            };
          }
          return null;
        })
        .filter((s) => s && s.items.length > 0);

      // 4. Collect sets explicitly containing targetCode
      for (const s of allSets) {
        if (s.items.includes(targetCode)) {
          matchingSets.push(s);
          s.items.forEach((r) => companionCodesSet.add(r));
        }
      }

      // 5. If champion uses this relic (core or option) but no explicit set has targetCode:
      // Synthesize a complete 3-relic build set (2 companion/core relics + targetCode)
      if ((isCore || isOption) && matchingSets.length === 0) {
        const candidatePool = [];
        if (Array.isArray(c.coreRelics)) {
          candidatePool.push(...c.coreRelics);
        } else if (c.coreRelics && typeof c.coreRelics === 'object') {
          if (Array.isArray(c.coreRelics.mandatory)) candidatePool.push(...c.coreRelics.mandatory);
          if (Array.isArray(c.coreRelics.options)) candidatePool.push(...c.coreRelics.options.flat());
        }
        if (allSets.length > 0 && allSets[0].items) {
          candidatePool.push(...allSets[0].items);
        }
        if (Array.isArray(c.otherRelicOptions)) {
          candidatePool.push(...c.otherRelicOptions);
        }

        const pickedCompanions = [];
        for (const cand of candidatePool) {
          if (cand && typeof cand === 'string' && cand !== targetCode && !pickedCompanions.includes(cand)) {
            pickedCompanions.push(cand);
            if (pickedCompanions.length === 2) break;
          }
        }

        const synthesizedItems = [...pickedCompanions, targetCode];
        const champEnName = c.translations?.en?.name || c.name;
        matchingSets.push({
          title: isOption ? 'Bộ Tùy Chọn' : 'Bộ Khuyên Dùng',
          recommendedStars: 3,
          items: synthesizedItems,
          description: isOption
            ? `Cổ vật tùy chọn kết hợp hiệu quả cùng các trang bị của ${c.name}.`
            : '',
          translations: {
            en: {
              title: isOption ? 'Optional Build' : 'Recommended Build',
              description: isOption
                ? `Optional relic that synergizes effectively with ${champEnName}'s build.`
                : ''
            }
          },
          videoLink: ''
        });

        pickedCompanions.forEach((r) => companionCodesSet.add(r));
      }

      if (isCore || matchingSets.length > 0 || isOption) {
        companionCodesSet.delete(targetCode);

        // Include otherRelicOptions in companionCodesSet for full icon/name lookup
        if (Array.isArray(c.otherRelicOptions)) {
          c.otherRelicOptions.forEach((r) => {
            if (typeof r === 'string' && r !== targetCode) companionCodesSet.add(r);
          });
        }

        // Collect companion relic details
        for (const code of companionCodesSet) {
          if (!companionRelicsMap[code] && relicMap.has(code)) {
            const cr = relicMap.get(code);
            companionRelicsMap[code] = {
              relicCode: cr.relicCode,
              name: cr.name,
              rarity: cr.rarity,
              type: cr.type,
              translations: cr.translations
            };
          }
        }

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
          isCore,
          coreDescription,
          isOption,
          isOtherOption: Array.isArray(c.otherRelicOptions) && c.otherRelicOptions.includes(targetCode),
          otherRelicOptions: Array.isArray(c.otherRelicOptions) ? c.otherRelicOptions : [],
          matchingSets,
          companionRelicCodes: [...companionCodesSet]
        });
      }
    }

    // Sort champions: Core first, then matching sets count, then name
    compatibleChampions.sort((a, b) => {
      if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
      if (b.matchingSets.length !== a.matchingSets.length) return b.matchingSets.length - a.matchingSets.length;
      return a.name.localeCompare(b.name);
    });

    const enriched = {
      ...relic,
      compatibleChampions,
      totalChampions: compatibleChampions.length,
      companionRelicsMap
    };

    return fields ? pickFields(enriched, fields, 'relicCode') : enriched;
  }
};
