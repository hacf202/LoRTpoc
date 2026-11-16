import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { matchSearchQuery, rankSearchResults } from '../utils/normalizeText.js';
import { paginateList } from '../utils/paginate.js';
import { loadCollectionFromDb } from '../config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mapsFilePath = path.join(__dirname, '../data/maps.json');
const bossesFilePath = path.join(__dirname, '../data/bosses.json');
const powersFilePath = path.join(__dirname, '../data/powers.json');
const championsFilePath = path.join(__dirname, '../data/champions.json');

let maps = [];
let bossesMap = new Map();
let powersMap = new Map();
let championsMap = new Map();

try {
  maps = JSON.parse(fs.readFileSync(mapsFilePath, 'utf8'));
  const rawBosses = JSON.parse(fs.readFileSync(bossesFilePath, 'utf8'));
  const rawPowers = JSON.parse(fs.readFileSync(powersFilePath, 'utf8'));
  const rawChamps = JSON.parse(fs.readFileSync(championsFilePath, 'utf8'));

  rawBosses.forEach((b) => {
    if (b.bossID) bossesMap.set(b.bossID, b);
  });
  rawPowers.forEach((p) => {
    if (p.powerCode) powersMap.set(p.powerCode, p);
  });
  rawChamps.forEach((c) => {
    if (c.championID) championsMap.set(c.championID, c);
    if (c.name) championsMap.set(c.name.toLowerCase(), c);
  });
} catch (err) {
  console.error('Failed to load maps/bosses/powers/champions dataset:', err.message);
}

export const mapService = {
  loadFromDb: async () => {
    const data = await loadCollectionFromDb('maps', 'maps.json');
    if (Array.isArray(data) && data.length > 0) {
      maps = data;
      console.log(`[MapService] Loaded ${maps.length} maps from MongoDB.`);
    }
    const rawBosses = await loadCollectionFromDb('bosses', 'bosses.json');
    if (Array.isArray(rawBosses) && rawBosses.length > 0) {
      bossesMap.clear();
      rawBosses.forEach((b) => {
        if (b.bossID) bossesMap.set(b.bossID, b);
      });
    }
    const rawPowers = await loadCollectionFromDb('powers', 'powers.json');
    if (Array.isArray(rawPowers) && rawPowers.length > 0) {
      powersMap.clear();
      rawPowers.forEach((p) => {
        if (p.powerCode) powersMap.set(p.powerCode, p);
      });
    }
    const rawChamps = await loadCollectionFromDb('champions', 'champions.json');
    if (Array.isArray(rawChamps) && rawChamps.length > 0) {
      championsMap.clear();
      rawChamps.forEach((c) => {
        if (c.championID) championsMap.set(c.championID, c);
        if (c.name) championsMap.set(c.name.toLowerCase(), c);
      });
    }
    return maps;
  },

  getAll: async (filter = {}) => {
    let result = [...maps];

    // 1. Search Query
    if (filter.search) {
      const q = filter.search.trim();
      result = rankSearchResults(result, q, (m) => ({
        id: m.adventureID,
        name: m.adventureName,
        enName: m.translations?.en?.adventureName || '',
        desc: `${m.typeAdventure || ''} ${m.specialRules || ''} ${m.requirement || ''}`
      }));
    }

    // 2. Adventure Type Filter (Multi-select OR logic)
    if (filter.type && filter.type !== 'all') {
      const typeList = filter.type
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      result = result.filter((m) => {
        const mType = (m.typeAdventure || '').toLowerCase();
        return typeList.some((t) => mType.includes(t) || t.includes(mType));
      });
    }

    // 3. Difficulty Filter (Supports ranges or specific stars)
    if (filter.difficulty && filter.difficulty !== 'all') {
      const diffKeys = String(filter.difficulty)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      result = result.filter((m) => {
        const d = Number(m.difficulty) || 0;
        return diffKeys.some((k) => {
          if (k === 'low') return d >= 0 && d <= 2;
          if (k === 'mid') return d > 2 && d <= 4;
          if (k === 'high') return d > 4 && d <= 6.5;
          if (k === 'nightmare' || k === '10') return d >= 10;
          const num = parseFloat(k);
          return !isNaN(num) && d === num;
        });
      });
    }

    // 4. Sorting
    const sortMode = filter.sort || 'difficulty-asc';
    result.sort((a, b) => {
      const diffA = Number(a.difficulty) || 0;
      const diffB = Number(b.difficulty) || 0;
      const nameA = a.adventureName || '';
      const nameB = b.adventureName || '';

      if (sortMode === 'difficulty-desc') {
        if (diffB !== diffA) return diffB - diffA;
        return nameA.localeCompare(nameB);
      }
      if (sortMode === 'name-asc') {
        return nameA.localeCompare(nameB);
      }
      if (sortMode === 'name-desc') {
        return nameB.localeCompare(nameA);
      }
      // default: difficulty-asc
      if (diffA !== diffB) return diffA - diffB;
      return nameA.localeCompare(nameB);
    });

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'adventureID');
    }

    if (filter.page || (filter.limit && filter.limit !== 'all')) {
      return paginateList(result, {
        page: filter.page || 1,
        limit: filter.limit || 24
      });
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
    const cleanId = String(id).toLowerCase().trim();
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNorm = norm(cleanId);

    const map = maps.find(
      (m) =>
        m.adventureID?.toLowerCase() === cleanId ||
        m.adventureName?.toLowerCase() === cleanId ||
        m.translations?.en?.adventureName?.toLowerCase() === cleanId ||
        norm(m.adventureID) === cleanNorm ||
        norm(m.adventureName) === cleanNorm ||
        norm(m.translations?.en?.adventureName) === cleanNorm
    ) || null;

    if (!map) return null;

    // Resolve rich details: bosses, bonus powers, special rules and champions
    const rawBossList = Array.isArray(map.Bosses) ? map.Bosses : [];
    const hasRealBosses = rawBossList.some((b) => bossesMap.has(b.bossID));

    const resolvedBosses = rawBossList
      .map((bItem) => {
        const bossData = bossesMap.get(bItem.bossID);

        // Case 1: Valid Boss from bossesMap
        if (bossData) {
          const rawPowerCodes = Array.isArray(bossData.power)
            ? bossData.power
            : bossData.power ? [bossData.power] : [];

          const resolvedPowers = rawPowerCodes
            .map((code) => powersMap.get(code) || { powerCode: code, name: code })
            .filter(Boolean);

          const bonusPowers = (bItem.mapBonusPower || []).map(
            (pCode) => powersMap.get(pCode) || { powerCode: pCode, name: pCode }
          );

          return {
            ...bItem,
            bossName: bossData.bossName || bItem.bossID,
            background: bossData.background || null,
            translations: bossData.translations || null,
            powers: resolvedPowers,
            resolvedPowers,
            bonusPowers
          };
        }

        // Case 2: Encounter power (only fallback if map has NO real bosses, e.g. M020)
        if (!hasRealBosses && powersMap.has(bItem.bossID)) {
          const encounterPower = powersMap.get(bItem.bossID);
          const bonusPowers = (bItem.mapBonusPower || []).map(
            (pCode) => powersMap.get(pCode) || { powerCode: pCode, name: pCode }
          );

          return {
            ...bItem,
            bossName: encounterPower.name,
            background: null,
            translations: encounterPower.translations
              ? { en: { bossName: encounterPower.translations.en?.name } }
              : null,
            powers: [encounterPower],
            resolvedPowers: [encounterPower],
            bonusPowers
          };
        }

        // Invalid / phantom ID (e.g. P0238, P0239, B2847, "") or non-boss -> Exclude
        return null;
      })
      .filter(Boolean);

    const resolvedSpecialRules = (map.specialRules || []).map(
      (pCode) => powersMap.get(pCode) || { powerCode: pCode, name: pCode }
    );

    const resolvedChampions = (map.requirement?.champions || []).map((cId) => {
      const champ = championsMap.get(cId) || championsMap.get(cId.toLowerCase()) || {};
      return {
        championID: cId,
        name: champ.name || cId,
        translations: champ.translations || null,
        avatar: champ.assets?.[0]?.avatar || (champ.name ? `https://images.lortpoc.com/avatarChampions/${champ.name}.webp` : null),
        regions: champ.regions || [],
        tier: champ.tier || null,
        maxStar: champ.maxStar || 3
      };
    });

    const enriched = {
      ...map,
      resolvedBosses,
      resolvedSpecialRules,
      resolvedChampions
    };

    return fields ? pickFields(enriched, fields, 'adventureID') : enriched;
  }
};