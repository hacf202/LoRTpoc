import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clearServerCache } from '../middlewares/cache.middleware.js';
import { loadCollectionFromDb } from '../config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

// In-Memory Lookup HashMaps for O(1) entity resolution
const relicsMap = new Map();
const itemsMap = new Map();
const powersMap = new Map();
const cardsMap = new Map();

// In-Memory Bidirectional Junction Index: Relic Code -> { compatibleChampions, companionRelicsMap, totalChampions }
const relicToChampionsIndex = new Map();

function readJson(fileName) {
  try {
    const fullPath = path.join(dataDir, fileName);
    if (!fs.existsSync(fullPath)) return [];
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    console.error(`[RelationService] Failed to read ${fileName}:`, err.message);
    return [];
  }
}

export const relationService = {
  async init() {
    await this.rebuild();
  },

  async rebuild(customData = null) {
    clearServerCache();
    const relics = customData?.relics || (await loadCollectionFromDb('relics', 'relics.json'));
    const items = customData?.items || (await loadCollectionFromDb('items', 'items.json'));
    const powers = customData?.powers || (await loadCollectionFromDb('powers', 'powers.json'));
    const cards = customData?.cards || (await loadCollectionFromDb('cards', 'cards.json'));
    const champions = customData?.champions || (await loadCollectionFromDb('champions', 'champions.json'));

    // 1. Rebuild Entity Lookup HashMaps
    relicsMap.clear();
    relics.forEach((r) => {
      if (r.relicCode) relicsMap.set(r.relicCode, r);
    });

    itemsMap.clear();
    items.forEach((it) => {
      if (it.itemCode) itemsMap.set(it.itemCode, it);
    });

    powersMap.clear();
    powers.forEach((p) => {
      if (p.powerCode) powersMap.set(p.powerCode, p);
    });

    cardsMap.clear();
    cards.forEach((c) => {
      if (c.cardCode) cardsMap.set(c.cardCode.toLowerCase(), c);
    });

    // 2. Rebuild In-Memory Reverse Index: Relic -> Champions
    relicToChampionsIndex.clear();
    this.buildRelicToChampionsIndex(relics, champions);
  },

  buildRelicToChampionsIndex(relics, champions) {
    for (const relic of relics) {
      const targetCode = relic.relicCode;
      if (!targetCode) continue;

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

        // 1. Check coreRelics
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

        // 3. Normalize all sets from c.relicSets
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

        // 5. Synthesize set if needed
        if ((isCore || isOption) && matchingSets.length === 0) {
          const candidatePool = [];
          if (Array.isArray(c.coreRelics)) candidatePool.push(...c.coreRelics);
          else if (c.coreRelics && typeof c.coreRelics === 'object') {
            if (Array.isArray(c.coreRelics.mandatory)) candidatePool.push(...c.coreRelics.mandatory);
            if (Array.isArray(c.coreRelics.options)) candidatePool.push(...c.coreRelics.options.flat());
          }
          if (allSets.length > 0 && allSets[0].items) candidatePool.push(...allSets[0].items);
          if (Array.isArray(c.otherRelicOptions)) candidatePool.push(...c.otherRelicOptions);

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

          if (Array.isArray(c.otherRelicOptions)) {
            c.otherRelicOptions.forEach((r) => {
              if (typeof r === 'string' && r !== targetCode) companionCodesSet.add(r);
            });
          }

          for (const code of companionCodesSet) {
            if (!companionRelicsMap[code] && relicsMap.has(code)) {
              const cr = relicsMap.get(code);
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

      compatibleChampions.sort((a, b) => {
        if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
        if (b.matchingSets.length !== a.matchingSets.length) return b.matchingSets.length - a.matchingSets.length;
        return a.name.localeCompare(b.name);
      });

      relicToChampionsIndex.set(targetCode, {
        compatibleChampions,
        totalChampions: compatibleChampions.length,
        companionRelicsMap
      });
    }
  },

  getRelicReferences(targetCode) {
    if (!relicToChampionsIndex.has(targetCode)) {
      return {
        compatibleChampions: [],
        totalChampions: 0,
        companionRelicsMap: {}
      };
    }
    return relicToChampionsIndex.get(targetCode);
  },

  hydrateChampion(champ) {
    if (!champ) return null;
    const resolvedRelics = {};
    const resolvedCards = {};
    const resolvedItems = {};
    const resolvedPowers = {};

    // 1. Resolve Relics
    const relicCodes = new Set();
    if (Array.isArray(champ.coreRelics)) {
      champ.coreRelics.forEach((r) => typeof r === 'string' && relicCodes.add(r));
    } else if (champ.coreRelics && typeof champ.coreRelics === 'object') {
      (champ.coreRelics.mandatory || []).forEach((r) => relicCodes.add(r));
      (champ.coreRelics.options || []).flat().forEach((r) => relicCodes.add(r));
    }
    if (Array.isArray(champ.relicSets)) {
      champ.relicSets.forEach((s) => {
        const items = Array.isArray(s) ? s : s?.items;
        if (Array.isArray(items)) {
          items.forEach((r) => typeof r === 'string' && relicCodes.add(r));
        }
      });
    }
    if (Array.isArray(champ.otherRelicOptions)) {
      champ.otherRelicOptions.forEach((r) => typeof r === 'string' && relicCodes.add(r));
    }

    for (const code of relicCodes) {
      if (relicsMap.has(code)) {
        const r = relicsMap.get(code);
        resolvedRelics[code] = {
          relicCode: r.relicCode,
          name: r.name,
          rarity: r.rarity,
          type: r.type,
          assetAbsolutePath: r.assetAbsolutePath,
          description: r.description,
          descriptionRaw: r.descriptionRaw,
          translations: r.translations
        };
      }
    }

    // 2. Resolve Cards in startingDeck
    const cardCodes = new Set();
    const baseCards = champ.startingDeck?.baseCards || [];
    const refCards = champ.startingDeck?.referenceCards || [];
    [...baseCards, ...refCards].forEach((c) => {
      if (c.cardCode) cardCodes.add(c.cardCode);
    });

    for (const code of cardCodes) {
      const lower = code.toLowerCase();
      if (cardsMap.has(lower)) {
        const cd = cardsMap.get(lower);
        resolvedCards[lower] = cd;
      }
    }

    // 3. Resolve Items
    const itemCodes = new Set(champ.itemIds || []);
    [...baseCards, ...refCards].forEach((c) => {
      (c.itemCodes || []).forEach((it) => {
        if (it?.itemCode) itemCodes.add(it.itemCode);
      });
    });

    for (const code of itemCodes) {
      if (itemsMap.has(code)) {
        const it = itemsMap.get(code);
        resolvedItems[code] = {
          itemCode: it.itemCode,
          name: it.name,
          rarity: it.rarity,
          assetAbsolutePath: it.assetAbsolutePath,
          description: it.description,
          descriptionRaw: it.descriptionRaw,
          translations: it.translations
        };
      }
    }

    // 4. Resolve Powers
    const powerCodes = new Set(champ.adventurePowerIds || []);
    if (Array.isArray(champ.powerStarIds)) {
      champ.powerStarIds.forEach((p) => powerCodes.add(p));
    }

    for (const code of powerCodes) {
      if (powersMap.has(code)) {
        const p = powersMap.get(code);
        resolvedPowers[code] = {
          powerCode: p.powerCode,
          name: p.name,
          rarity: p.rarity,
          assetAbsolutePath: p.assetAbsolutePath,
          description: p.description,
          descriptionRaw: p.descriptionRaw,
          translations: p.translations
        };
      }
    }

    return {
      ...champ,
      resolvedRelics,
      resolvedCards,
      resolvedItems,
      resolvedPowers
    };
  }
};

// Initialize index when module loads
relationService.init();
