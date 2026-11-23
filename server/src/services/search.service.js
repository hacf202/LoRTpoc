import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateEntityScore, removeVietnameseTones } from '../utils/searchUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

function loadJson(fileName) {
  try {
    const fullPath = path.join(dataDir, fileName);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch (err) {
    console.error(`Failed to load ${fileName}:`, err.message);
  }
  return [];
}

const champions = loadJson('champions.json');
const relics = loadJson('relics.json');
const powers = loadJson('powers.json');
const items = loadJson('items.json');
const cards = loadJson('cards.json');
const maps = loadJson('maps.json');

export const searchService = {
  /**
   * Omni-Search across all core entities in Legends of Runeterra: The Path of Champions.
   * Tiêu chuẩn chuẩn hóa:
   * 1. Khử dấu 100% tiếng Việt (NFD + đ/Đ -> d)
   * 2. Tìm kiếm song ngữ Anh - Việt
   * 3. Xếp hạng tương thích: Khớp chính xác > Tiền tố > Đầu từ > Chuỗi con
   * 4. QUY TẮC BẮT BUỘC: Càng ít chữ càng ngắn lên đầu (Length Penalty)
   *
   * @param {string} query Search keyword
   * @param {object} options Category limits
   */
  omniSearch: (query = '', options = {}) => {
    const q = String(query || '').trim();
    if (!q) {
      return {
        query: '',
        total: 0,
        categories: {
          champions: [],
          relics: [],
          powers: [],
          items: [],
          cards: [],
          maps: []
        },
        flat: []
      };
    }

    const categoryLimit = Number(options.limitPerCategory) || 12;
    const cleanQ = removeVietnameseTones(q);
    const queryRegex = new RegExp(`(?:^|\\s)${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

    // 1. Champions Search
    const matchedChampions = [];
    for (const c of champions) {
      const score = calculateEntityScore(c, q, (item) => ({
        nameVi: item.name,
        nameEn: item.translations?.en?.name,
        code: `${item.championID || ''} ${item.cardCode || ''}`,
        desc: item.descriptionRaw || item.description
      }), queryRegex);
      if (score > 0) {
        matchedChampions.push({
          score: score + 120, // Ưu tiên nhẹ Tướng khi tìm kiếm toàn hệ thống
          item: {
            id: c.championID || c.cardCode || c.name,
            type: 'champion',
            typeLabelVi: 'Tướng',
            typeLabelEn: 'Champion',
            name: c.name,
            enName: c.translations?.en?.name || c.name,
            rarity: c.rarity || 'Champion',
            cost: c.cost,
            regions: c.regions || [],
            stars: c.maxStar || 3,
            tier: c.tier || 'A',
            imageUrl:
              c.assets?.[0]?.avatar ||
              c.assets?.[0]?.gameAbsolutePath ||
              `https://images.lortpoc.com/avatarChampions/${c.championID}.webp`,
            description: c.description || c.translations?.en?.description || '',
            raw: c
          }
        });
      }
    }
    matchedChampions.sort((a, b) => b.score - a.score);
    const topChampions = matchedChampions.slice(0, categoryLimit).map((m) => m.item);

    // 2. Relics Search
    const matchedRelics = [];
    for (const r of relics) {
      const score = calculateEntityScore(r, q, (item) => ({
        nameVi: item.name,
        nameEn: item.translations?.en?.name,
        code: r.relicCode,
        desc: item.descriptionRaw || item.description
      }), queryRegex);
      if (score > 0) {
        matchedRelics.push({
          score: score + 80,
          item: {
            id: r.relicCode || r.name,
            type: 'relic',
            typeLabelVi: 'Cổ Vật',
            typeLabelEn: 'Relic',
            name: r.name,
            enName: r.translations?.en?.name || r.name,
            rarity: r.rarity || 'Common',
            imageUrl: r.image || r.assetAbsolutePath || '',
            description: r.descriptionRaw || r.description || '',
            raw: r
          }
        });
      }
    }
    matchedRelics.sort((a, b) => b.score - a.score);
    const topRelics = matchedRelics.slice(0, categoryLimit).map((m) => m.item);

    // 3. Powers Search
    const matchedPowers = [];
    for (const p of powers) {
      const score = calculateEntityScore(p, q, (item) => ({
        nameVi: item.name,
        nameEn: item.translations?.en?.name,
        code: p.powerCode,
        desc: item.descriptionRaw || item.description
      }), queryRegex);
      if (score > 0) {
        matchedPowers.push({
          score: score + 70,
          item: {
            id: p.powerCode || p.name,
            type: 'power',
            typeLabelVi: 'Sức Mạnh',
            typeLabelEn: 'Power',
            name: p.name,
            enName: p.translations?.en?.name || p.name,
            rarity: p.rarity || 'Common',
            imageUrl: p.assetAbsolutePath || p.assetFullAbsolutePath || '',
            description: p.descriptionRaw || p.description || '',
            raw: p
          }
        });
      }
    }
    matchedPowers.sort((a, b) => b.score - a.score);
    const topPowers = matchedPowers.slice(0, categoryLimit).map((m) => m.item);

    // 4. Items Search
    const matchedItems = [];
    for (const it of items) {
      const score = calculateEntityScore(it, q, (item) => ({
        nameVi: item.name,
        nameEn: item.translations?.en?.name,
        code: item.itemCode,
        desc: item.descriptionRaw || item.description
      }), queryRegex);
      if (score > 0) {
        matchedItems.push({
          score: score + 40,
          item: {
            id: it.itemCode || it.name,
            type: 'item',
            typeLabelVi: 'Vật Phẩm',
            typeLabelEn: 'Item',
            name: it.name,
            enName: it.translations?.en?.name || it.name,
            rarity: it.rarity || 'Common',
            imageUrl: it.assetAbsolutePath || it.assetFullAbsolutePath || '',
            description: it.descriptionRaw || item.description || '',
            raw: it
          }
        });
      }
    }
    matchedItems.sort((a, b) => b.score - a.score);
    const topItems = matchedItems.slice(0, categoryLimit).map((m) => m.item);

    // 5. Cards Search
    const matchedCards = [];
    for (const card of cards) {
      const score = calculateEntityScore(card, q, (item) => ({
        nameVi: item.cardName || item.name,
        nameEn: item.translations?.en?.name,
        code: item.cardCode,
        desc: item.descriptionRaw || item.description
      }), queryRegex);
      if (score > 0) {
        matchedCards.push({
          score: score + 30,
          item: {
            id: card.cardCode || card.cardName || card.name,
            type: 'card',
            typeLabelVi: 'Thẻ Bài',
            typeLabelEn: 'Card',
            name: card.cardName || card.name,
            enName: card.translations?.en?.name || card.cardName || card.name,
            rarity: card.rarity || 'Common',
            cost: card.cost,
            regions: card.regions || [],
            imageUrl: card.gameAbsolutePath || '',
            description: card.descriptionRaw || card.description || '',
            raw: card
          }
        });
      }
    }
    matchedCards.sort((a, b) => b.score - a.score);
    const topCards = matchedCards.slice(0, categoryLimit).map((m) => m.item);

    // 6. Maps / Adventures Search
    const matchedMaps = [];
    for (const map of maps) {
      const score = calculateEntityScore(map, q, (item) => ({
        nameVi: item.adventureName || item.name,
        nameEn: item.translations?.en?.adventureName,
        code: item.adventureID,
        desc: item.requirement || ''
      }), queryRegex);
      if (score > 0) {
        matchedMaps.push({
          score: score + 50,
          item: {
            id: map.adventureID || map.adventureName || map.name,
            type: 'map',
            typeLabelVi: 'Cuộc Phiêu Lưu',
            typeLabelEn: 'Adventure',
            name: map.adventureName || map.name,
            enName: map.translations?.en?.adventureName || map.adventureName || map.name,
            difficulty: map.difficulty,
            imageUrl: map.background || map.assetAbsolutePath || '',
            description: map.requirement || '',
            raw: map
          }
        });
      }
    }
    matchedMaps.sort((a, b) => b.score - a.score);
    const topMaps = matchedMaps.slice(0, categoryLimit).map((m) => m.item);

    // Tổng hợp flat list sắp xếp theo điểm tương thích tổng thể
    const allScored = [
      ...matchedChampions,
      ...matchedRelics,
      ...matchedPowers,
      ...matchedItems,
      ...matchedCards,
      ...matchedMaps
    ];
    allScored.sort((a, b) => b.score - a.score);
    const flat = allScored.slice(0, categoryLimit * 3).map((s) => s.item);

    return {
      query: q,
      total: allScored.length,
      categories: {
        champions: topChampions,
        relics: topRelics,
        powers: topPowers,
        items: topItems,
        cards: topCards,
        maps: topMaps
      },
      flat
    };
  }
};
