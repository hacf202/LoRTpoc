import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { matchSearchQuery, rankSearchResults } from '../utils/searchUtils.js';
import { paginateList } from '../utils/paginate.js';
import { relationService } from './relation.service.js';
import { loadCollectionFromDb, upsertDbDocument, deleteDbDocument } from '../config/dbDataLoader.js';
import { invalidateServerCache } from '../middlewares/cache.middleware.js';
import { toChampionSlug } from '../utils/slug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = path.join(__dirname, '../data/champions.json');

// Read champions dataset
let champions = [];
try {
  const rawData = fs.readFileSync(dataFilePath, 'utf8');
  champions = JSON.parse(rawData);
} catch (err) {
  console.error('Failed to load champions dataset:', err.message);
  champions = [];
}

const keyPriority = [
  'championID',
  'name',
  'cardCode',
  'regions',
  'cost',
  'tier',
  'maxStar',
  'optimalStars',
  'playStyle',
  'tags',
  'description',
  'descriptionRaw',
  'assets',
  'coreRelics',
  'relicSets',
  'otherRelicOptions',
  'ratings',
  'startingDeck',
  'constellation',
  'videoLink',
  'powerStarIds',
  'itemIds',
  'runeIds',
  'adventurePowerIds',
  'supportChampions',
  'communityRatings',
  'translations'
];

function orderChampionKeys(c) {
  const ordered = {};
  keyPriority.forEach((k) => {
    if (k in c) {
      ordered[k] = c[k];
    }
  });
  Object.keys(c)
    .sort()
    .forEach((k) => {
      if (!(k in ordered)) {
        ordered[k] = c[k];
      }
    });
  return ordered;
}

function sanitizeChampionPayload(data) {
  if (!data || typeof data !== 'object') return data;
  const clean = { ...data };

  // 1. Remove comboSteps, proTips, powerSpike and counter at root level
  delete clean.comboSteps;
  delete clean.proTips;
  delete clean.powerSpike;
  delete clean.counter;

  // 2. Sanitize relicSets
  if (Array.isArray(clean.relicSets)) {
    clean.relicSets = clean.relicSets.map((set) => {
      if (!set || typeof set !== 'object') return set;
      const s = { ...set };
      delete s.comboSteps;
      delete s.proTips;

      // Loại bỏ hoàn toàn title của relicSets cả tiếng Việt lẫn tiếng Anh
      delete s.title;
      if (s.translations?.en) {
        delete s.translations.en.title;
        if (Object.keys(s.translations.en).length === 0) {
          delete s.translations.en;
        }
      }
      if (s.translations && Object.keys(s.translations).length === 0) {
        delete s.translations;
      }

      // Ensure items is an array of max 3 strings
      if (Array.isArray(s.items)) {
        s.items = s.items.map((it) => String(it).trim().toUpperCase()).filter(Boolean).slice(0, 3);
      }

      return s;
    });
  }

  // 3. Sanitize powerStarIds, adventurePowerIds, itemIds
  if (Array.isArray(clean.powerStarIds)) {
    clean.powerStarIds = clean.powerStarIds.map((p) => String(p || '').trim().toUpperCase()).slice(0, 6);
    while (clean.powerStarIds.length < 6) clean.powerStarIds.push('');
  }

  if (Array.isArray(clean.adventurePowerIds)) {
    clean.adventurePowerIds = clean.adventurePowerIds.map((p) => String(p || '').trim().toUpperCase()).filter(Boolean);
  }

  if (Array.isArray(clean.itemIds)) {
    clean.itemIds = clean.itemIds.map((it) => String(it || '').trim().toUpperCase()).filter(Boolean);
  }

  return clean;
}

function saveChampionsToFile() {
  try {
    // 1. Sort A-Z by name
    champions.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base', numeric: true })
    );

    // 2. Format keys with basic info at the top
    const formatted = champions.map(orderChampionKeys);

    // 3. Backup current file
    if (fs.existsSync(dataFilePath)) {
      const backupPath = `${dataFilePath}.bak`;
      fs.copyFileSync(dataFilePath, backupPath);
    }

    // 4. Safe sync write
    fs.writeFileSync(dataFilePath, JSON.stringify(formatted, null, 2), 'utf8');
    champions = formatted;

    // 5. Đồng bộ sang constellations.json nếu tướng có dữ liệu chòm sao
    try {
      const constsFilePath = path.join(__dirname, '../data/constellations.json');
      if (fs.existsSync(constsFilePath)) {
        const consts = JSON.parse(fs.readFileSync(constsFilePath, 'utf8'));
        champions.forEach((champ) => {
          if (champ.constellation && Array.isArray(champ.constellation.nodes) && champ.constellation.nodes.length > 0) {
            const targetId = (champ.championID || '').toLowerCase();
            const targetName = (champ.name || '').toLowerCase();
            const idx = consts.findIndex(
              (c) =>
                (c.constellationID && c.constellationID.toLowerCase() === targetId) ||
                (c.championName && c.championName.toLowerCase() === targetName)
            );
            const constItem = {
              constellationID: champ.constellation.constellationID || champ.championID,
              championName: champ.constellation.championName || champ.name,
              backgroundImage: champ.constellation.backgroundImage || '',
              nodes: champ.constellation.nodes || []
            };
            if (idx >= 0) {
              consts[idx] = { ...consts[idx], ...constItem };
            } else {
              consts.push(constItem);
            }
          }
        });
        fs.writeFileSync(constsFilePath, JSON.stringify(consts, null, 2), 'utf8');
      }
    } catch (constErr) {
      console.error('Failed to sync constellations dataset:', constErr.message);
    }

    return true;
  } catch (err) {
    console.error('Failed to save champions dataset:', err.message);
    return false;
  }
}

export const championService = {
  getAll: async (filter = {}) => {
    let result = [...champions];

    // 1. Search Query (Accent-insensitive, bilingual, relevance score & shortest first)
    if (filter.search) {
      const q = filter.search;
      result = rankSearchResults(result, q, (c) => ({
        nameVi: c.name,
        nameEn: c.translations?.en?.name,
        code: `${c.championID || ''} ${c.cardCode || ''}`,
        desc: `${c.descriptionRaw || c.description || ''} ${(c.regions || []).join(' ')} ${(c.tags || []).join(' ')}`
      }));
    }

    // 2. Multi-Select Regions Filter (e.g. "shurima,demacia" or ["shurima", "demacia"])
    const rawRegions = filter.regions || filter.region;
    if (rawRegions) {
      const normalizeReg = (str) => {
        if (!str) return '';
        const s = String(str)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toLowerCase()
          .trim();
        if (s === 'hoa linh luc dia' || s === 'hoa linh lam' || s === 'spirit blossom' || s === 'spiritblossom') return 'spiritblossom';
        if (s === 'quan dao bong dem' || s === 'shadow isles' || s === 'shadowisles') return 'shadowisles';
        if (s === 'thanh pho bandle' || s === 'bandle city' || s === 'bandlecity') return 'bandlecity';
        if (s === 'piltover & zaun' || s === 'piltover and zaun' || s === 'piltoverzaun') return 'piltoverzaun';
        return s;
      };

      const regionList = Array.isArray(rawRegions)
        ? rawRegions.map(normalizeReg)
        : String(rawRegions)
            .split(',')
            .map(normalizeReg)
            .filter(Boolean);

      if (regionList.length > 0 && !regionList.includes('all')) {
        result = result.filter(
          (c) => Array.isArray(c.regions) && c.regions.some((reg) => regionList.includes(normalizeReg(reg)))
        );
      }
    }

    // 3. Multi-Select Stars Filter (e.g. "3,6" or [3, 6])
    const rawStars = filter.stars || filter.maxStar;
    if (rawStars) {
      const starList = Array.isArray(rawStars)
        ? rawStars.map(Number)
        : String(rawStars)
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));

      if (starList.length > 0 && !starList.includes(NaN)) {
        result = result.filter((c) => starList.includes(c.maxStar || 3));
      }
    }

    // 4. Multi-Select Cost Filter (e.g. "1,2,5,7+" or [1, 2])
    const rawCosts = filter.costs ?? filter.cost;
    if (rawCosts !== undefined && rawCosts !== null && rawCosts !== '' && rawCosts !== 'all') {
      const costList = Array.isArray(rawCosts)
        ? rawCosts.map((c) => String(c).trim())
        : String(rawCosts)
            .split(',')
            .map((c) => String(c).trim())
            .filter(Boolean);

      if (costList.length > 0 && !costList.includes('all')) {
        result = result.filter((c) => {
          const cCost = Number(c.cost);
          return costList.some((costVal) => {
            if (costVal === '7+' || costVal === '7') {
              return costVal === '7+' ? cCost >= 7 : cCost === 7;
            }
            return cCost === parseInt(costVal, 10);
          });
        });
      }
    }

    // 5. Multi-Select Tags Filter (e.g. "Control,Spells")
    const rawTags = filter.tags || filter.tag;
    if (rawTags) {
      const tagList = Array.isArray(rawTags)
        ? rawTags.map((t) => String(t).toLowerCase().trim())
        : String(rawTags)
            .split(',')
            .map((t) => t.toLowerCase().trim())
            .filter(Boolean);

      if (tagList.length > 0 && !tagList.includes('all')) {
        result = result.filter(
          (c) => Array.isArray(c.tags) && c.tags.some((tg) => tagList.includes(tg.toLowerCase().trim()))
        );
      }
    }

    // 6. Tier Filter (Single / Multiple)
    if (filter.tier && filter.tier !== 'all') {
      const tKey = filter.tier.toUpperCase().trim();
      result = result.filter((c) => c.tier && c.tier.toUpperCase().includes(tKey));
    }

    // 7. Sorting Champions (nếu đang tìm kiếm và sort mặc định name-asc thì giữ nguyên thứ tự tương thích)
    if (filter.sort && (!filter.search || filter.sort !== 'name-asc')) {
      if (filter.sort === 'name-asc') {
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (filter.sort === 'name-desc') {
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      } else if (filter.sort === 'stars-desc') {
        result.sort((a, b) => (b.maxStar || 3) - (a.maxStar || 3));
      } else if (filter.sort === 'stars-asc') {
        result.sort((a, b) => (a.maxStar || 3) - (b.maxStar || 3));
      } else if (filter.sort === 'cost-asc') {
        result.sort((a, b) => (a.cost || 0) - (b.cost || 0));
      } else if (filter.sort === 'cost-desc') {
        result.sort((a, b) => (b.cost || 0) - (a.cost || 0));
      } else if (filter.sort === 'tier') {
        const getTierWeight = (t) => {
          if (!t) return 0;
          const u = t.split('//')[0].trim().toUpperCase();
          if (u.startsWith('S+')) return 9;
          if (u.startsWith('S')) return 8;
          if (u.startsWith('A+')) return 7;
          if (u.startsWith('A')) return 6;
          if (u.startsWith('B+')) return 5;
          if (u.startsWith('B')) return 4;
          if (u.startsWith('C')) return 3;
          if (u.startsWith('D')) return 2;
          return 1;
        };
        result.sort((a, b) => {
          const diff = getTierWeight(b.tier) - getTierWeight(a.tier);
          return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '');
        });
      }
    }

    // Dynamic Field Selection (Sparse Fieldsets)
    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'championID');
    } else if (filter.summary === 'true' || filter.summary === true) {
      // Summary mode for fast grid/roster rendering (reduces payload by ~94%)
      result = result.map((c) => ({
        championID: c.championID,
        name: c.name,
        cardCode: c.cardCode,
        cost: c.cost,
        regions: c.regions,
        maxStar: c.maxStar,
        tier: c.tier,
        tags: c.tags,
        assets: c.assets,
        translations: c.translations?.en
          ? {
              en: {
                name: c.translations.en.name,
                tier: c.translations.en.tier
              }
            }
          : undefined
      }));
    }

    // Standard pagination (default 24 per page if page/limit queried, or full if unconstrained)
    if (filter.page || (filter.limit && filter.limit !== 'all')) {
      const paginated = paginateList(result, filter);
      return paginated;
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

  getById: async (id, fields = null) => {
    let rawId = String(id).trim();
    try {
      rawId = decodeURIComponent(rawId);
    } catch {
      // keep rawId
    }
    const cleanId = rawId.toLowerCase();
    const targetSlug = toChampionSlug(rawId);
    const targetNorm = targetSlug.replace(/-/g, '');

    // 1. Exact match on ID, Code, Name, English name, or clean slug
    let champion = champions.find(
      (c) =>
        c.championID?.toLowerCase() === cleanId ||
        c.cardCode?.toLowerCase() === cleanId ||
        c.name?.toLowerCase() === cleanId ||
        c.translations?.en?.name?.toLowerCase() === cleanId ||
        toChampionSlug(c.name) === targetSlug ||
        toChampionSlug(c.translations?.en?.name) === targetSlug
    );

    // 2. Normalized match (handles slugs without hyphens or alternate formats)
    if (!champion && targetNorm) {
      champion = champions.find(
        (c) =>
          toChampionSlug(c.name).replace(/-/g, '') === targetNorm ||
          toChampionSlug(c.translations?.en?.name).replace(/-/g, '') === targetNorm ||
          c.championID?.toLowerCase() === targetNorm ||
          c.cardCode?.toLowerCase() === targetNorm
      );
    }

    // 3. Fallback: Prefix/partial match for multi-title names (e.g. "yasuo" matching "Yasuo")
    if (!champion && targetNorm) {
      champion = champions.find((c) => toChampionSlug(c.name).replace(/-/g, '').startsWith(targetNorm));
    }

    if (!champion) return null;
    const hydrated = relationService.hydrateChampion(champion);
    return fields ? pickFields(hydrated, fields, 'championID') : hydrated;
  },

  create: async (data) => {
    const cleanData = sanitizeChampionPayload(data);
    const newChampion = {
      championID: cleanData.championID || `C${String(champions.length + 1).padStart(3, '0')}`,
      name: cleanData.name,
      regions: Array.isArray(cleanData.regions) ? cleanData.regions : [cleanData.region || 'Runeterra'],
      maxStar: Number(cleanData.maxStar) || 3,
      assets: cleanData.assets || [],
      ...cleanData
    };

    // 1. Persist directly to MongoDB (Source of Truth)
    await upsertDbDocument('champions', { championID: newChampion.championID }, newChampion);

    // 2. Update memory & relations
    champions.push(newChampion);
    relationService.rebuild();

    // 3. Invalidate server caches
    await invalidateServerCache('/champions');
    await invalidateServerCache('/search');
    await invalidateServerCache('/tierlist');

    // 4. Save local JSON backup
    saveChampionsToFile();

    return newChampion;
  },

  loadFromDb: async () => {
    const data = await loadCollectionFromDb('champions', 'champions.json');
    if (Array.isArray(data) && data.length > 0) {
      champions = data;
      console.log(`[ChampionService] Loaded ${champions.length} champions from MongoDB.`);
    }
    return champions;
  },

  update: async (id, data) => {
    const cleanId = String(id).toLowerCase().trim();
    const index = champions.findIndex(
      (c) =>
        c.championID?.toLowerCase() === cleanId ||
        c.cardCode?.toLowerCase() === cleanId ||
        c.name?.toLowerCase() === cleanId
    );
    if (index === -1) return null;

    const cleanData = sanitizeChampionPayload(data);
    const updatedChamp = {
      ...champions[index],
      ...cleanData,
      championID: champions[index].championID // Keep primary ID immutable
    };

    // 1. Persist directly to MongoDB first (Source of Truth)
    await upsertDbDocument('champions', { championID: updatedChamp.championID }, updatedChamp);

    // 2. Update memory & relations
    champions[index] = updatedChamp;
    relationService.rebuild();

    // 3. Invalidate server caches across Redis & memory
    await invalidateServerCache('/champions');
    await invalidateServerCache('/search');
    await invalidateServerCache('/tierlist');

    // 4. Save local JSON backup
    saveChampionsToFile();

    return champions[index];
  },

  delete: async (id) => {
    const cleanId = String(id).toLowerCase().trim();
    const index = champions.findIndex(
      (c) =>
        c.championID?.toLowerCase() === cleanId ||
        c.cardCode?.toLowerCase() === cleanId ||
        c.name?.toLowerCase() === cleanId
    );
    if (index === -1) return false;

    const targetChamp = champions[index];

    // 1. Delete from MongoDB first
    await deleteDbDocument('champions', { championID: targetChamp.championID });

    // 2. Remove from memory & rebuild relations
    champions.splice(index, 1);
    relationService.rebuild();

    // 3. Invalidate server caches
    await invalidateServerCache('/champions');
    await invalidateServerCache('/search');
    await invalidateServerCache('/tierlist');

    // 4. Save local JSON backup
    saveChampionsToFile();

    return true;
  },

  getFilterOptions: async () => {
    const regions = new Set();
    const stars = new Set();
    const costs = new Set();
    const tiers = new Set();
    const tags = new Set();

    champions.forEach((c) => {
      if (Array.isArray(c.regions)) {
        c.regions.forEach((r) => regions.add(r.toLowerCase().trim()));
      }
      if (c.maxStar) stars.add(c.maxStar);
      if (c.cost !== undefined) costs.add(c.cost);
      if (c.tier) {
        const shortTier = c.tier.split('//')[0].trim();
        if (shortTier) tiers.add(shortTier);
      }
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t) => {
          if (t && typeof t === 'string' && t.trim()) {
            tags.add(t.trim());
          }
        });
      }
    });

    return {
      regions: Array.from(regions).sort(),
      stars: Array.from(stars).sort((a, b) => b - a),
      costs: Array.from(costs).sort((a, b) => a - b),
      tiers: Array.from(tiers).sort(),
      tags: Array.from(tags).sort()
    };
  }
};
