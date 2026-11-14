import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { rankSearchResults } from '../utils/searchUtils.js';
import { paginateList } from '../utils/paginate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cardsFilePath = path.join(__dirname, '../data/cards.json');
const championsFilePath = path.join(__dirname, '../data/champions.json');

let cards = [];
try {
  cards = JSON.parse(fs.readFileSync(cardsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load cards dataset:', err.message);
  cards = [];
}

let champions = [];
try {
  champions = JSON.parse(fs.readFileSync(championsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load champions in card service:', err.message);
  champions = [];
}

export const cardService = {
  getAll: async (filter = {}) => {
    let result = [...cards];

    if (filter.codes) {
      const codeList = filter.codes.split(',').map((c) => c.toLowerCase().trim());
      result = result.filter((cd) => codeList.includes(cd.cardCode?.toLowerCase()));
      if (filter.fields) {
        result = pickListFields(result, filter.fields, 'cardCode');
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
    }

    // Bỏ qua các biến thể (T1, T2, T3...) nếu không yêu cầu và người dùng không tìm kiếm biến thể
    const includeVariants = filter.includeVariants === true || filter.includeVariants === 'true';
    if (!includeVariants) {
      const isSearchingVariant = filter.search && (/T\d+/i.test(filter.search) || filter.search.length >= 7);
      if (!isSearchingVariant) {
        result = result.filter((cd) => !/^\d{2}[A-Z]{2}\d{3}T\d+$/i.test(cd.cardCode || ''));
      }
    }

    if (filter.search) {
      const q = filter.search.trim();
      if (q) {
        result = rankSearchResults(result, q, (cd) => ({
          nameVi: cd.cardName || '',
          nameEn: cd.translations?.en?.cardName || '',
          code: cd.cardCode || '',
          desc: cd.descriptionRaw || ''
        }));
      }
    }

    // Support multi-select regions (OR logic)
    if (filter.region && filter.region !== 'all') {
      const regionList = filter.region
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      result = result.filter((cd) => {
        const cdRegions = (Array.isArray(cd.regions) ? cd.regions : []).map((r) => (r || '').toLowerCase());
        return regionList.some((targetReg) =>
          cdRegions.some((r) => r.includes(targetReg) || targetReg.includes(r))
        );
      });
    }

    // Support multi-select rarities (OR logic)
    if (filter.rarity && filter.rarity !== 'all') {
      const rKey = filter.rarity.toLowerCase().trim();
      const rarities = rKey.split(',').map((s) => s.trim()).filter(Boolean);
      result = result.filter((cd) => {
        const viRarity = (cd.rarity || '').toLowerCase();
        const enRarity = (cd.translations?.en?.rarity || '').toLowerCase();
        return rarities.some((target) => {
          if (target === 'common' || target === 'thường') return viRarity.includes('common') || viRarity.includes('thường') || enRarity.includes('common');
          if (target === 'rare' || target === 'hiếm') return viRarity.includes('rare') || viRarity.includes('hiếm') || enRarity.includes('rare');
          if (target === 'epic' || target === 'sử thi') return viRarity.includes('epic') || viRarity.includes('sử thi') || enRarity.includes('epic');
          if (target === 'champion' || target === 'tướng' || target === 'anh hùng' || target === 'anh hung') {
            return viRarity.includes('champion') || viRarity.includes('tướng') || viRarity.includes('anh hùng') || enRarity.includes('champion');
          }
          return viRarity.includes(target) || enRarity.includes(target);
        });
      });
    }

    // Support multi-select costs (OR logic)
    if (filter.cost !== undefined && filter.cost !== null && filter.cost !== '' && filter.cost !== 'all') {
      const costStrings = String(filter.cost).split(',').map((s) => s.trim()).filter(Boolean);
      result = result.filter((cd) => {
        const cardCost = cd.cost ?? 0;
        return costStrings.some((cStr) => {
          const cNum = parseInt(cStr, 10);
          if (isNaN(cNum)) return false;
          if (cNum >= 8 || cStr === '8+') return cardCost >= 8;
          return cardCost === cNum;
        });
      });
    }

    // Support multi-select card types (OR logic)
    if (filter.type && filter.type !== 'all') {
      const typeList = filter.type
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      result = result.filter((cd) => {
        const cdType = (cd.type || '').toLowerCase();
        return typeList.some((t) => cdType.includes(t) || t.includes(cdType));
      });
    }

    // Default sorting (or explicit cost-asc): Put Champion rarity cards at the top, then sort by cost ascending
    const isChamp = (c) => {
      const r = (c.rarity || '').toLowerCase();
      const st = (c.supertype || '').toLowerCase();
      const enR = (c.translations?.en?.rarity || '').toLowerCase();
      return r.includes('champion') || r.includes('tướng') || st.includes('champion') || enR.includes('champion');
    };

    const sortMode = filter.sort || 'cost-asc';

    if (sortMode === 'cost-asc') {
      result.sort((a, b) => {
        const aChamp = isChamp(a);
        const bChamp = isChamp(b);
        if (aChamp && !bChamp) return -1;
        if (!aChamp && bChamp) return 1;
        const costDiff = (a.cost ?? 0) - (b.cost ?? 0);
        if (costDiff !== 0) return costDiff;
        return (a.cardName || '').localeCompare(b.cardName || '');
      });
    } else if (sortMode === 'cost-desc') {
      result.sort((a, b) => {
        const costDiff = (b.cost ?? 0) - (a.cost ?? 0);
        if (costDiff !== 0) return costDiff;
        return (a.cardName || '').localeCompare(b.cardName || '');
      });
    } else if (sortMode === 'name-asc') {
      result.sort((a, b) => (a.cardName || '').localeCompare(b.cardName || ''));
    } else if (sortMode === 'name-desc') {
      result.sort((a, b) => (b.cardName || '').localeCompare(a.cardName || ''));
    } else if (sortMode === 'rarity-desc') {
      const rarityScore = (r) => {
        const s = (r || '').toLowerCase();
        if (s.includes('champion') || s.includes('tướng')) return 4;
        if (s.includes('epic') || s.includes('sử thi')) return 3;
        if (s.includes('rare') || s.includes('hiếm')) return 2;
        if (s.includes('common') || s.includes('thường')) return 1;
        return 0;
      };
      result.sort((a, b) => {
        const diff = rarityScore(b.rarity) - rarityScore(a.rarity);
        if (diff !== 0) return diff;
        return (a.cost ?? 0) - (b.cost ?? 0);
      });
    }

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'cardCode');
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

  getByCode: async (code, fields = null) => {
    const cleanCode = String(code).toLowerCase().trim();
    const card = cards.find(
      (cd) =>
        cd.cardCode?.toLowerCase() === cleanCode ||
        cd.cardName?.toLowerCase() === cleanCode ||
        cd.translations?.en?.cardName?.toLowerCase() === cleanCode
    ) || null;

    if (!card) return null;

    const targetCode = card.cardCode;
    const compatibleChampions = [];

    for (const c of champions) {
      const isChampionCard =
        c.cardCode === targetCode ||
        c.championID === targetCode ||
        (c.assets && c.assets.some?.((a) => a.avatar?.includes(targetCode)));

      const isStartingDeck =
        c.startingDeck?.baseCards &&
        Array.isArray(c.startingDeck.baseCards) &&
        c.startingDeck.baseCards.some((b) => b.cardCode === targetCode);

      const isReferenceCard =
        c.startingDeck?.referenceCards &&
        Array.isArray(c.startingDeck.referenceCards) &&
        c.startingDeck.referenceCards.some((r) => r.cardCode === targetCode);

      if (isChampionCard || isStartingDeck || isReferenceCard) {
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
          isChampionCard,
          isStartingDeck,
          isReferenceCard
        });
      }
    }

    // Sort champions: Champion itself first, then Starting Deck, then Reference, then alphabetically
    compatibleChampions.sort((a, b) => {
      if (a.isChampionCard !== b.isChampionCard) return a.isChampionCard ? -1 : 1;
      if (a.isStartingDeck !== b.isStartingDeck) return a.isStartingDeck ? -1 : 1;
      if (a.isReferenceCard !== b.isReferenceCard) return a.isReferenceCard ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    // 1. Tập hợp tất cả các lá bài liên quan & biến thể (T1, T2, T3...)
    const refCodesSet = new Set(
      (Array.isArray(card.associatedCardRefs) ? card.associatedCardRefs : [])
        .map((c) => String(c).trim())
        .filter(Boolean)
    );

    const baseCodeMatch = targetCode.match(/^(\d{2}[A-Z]{2}\d{3})(?:T\d+)?$/i);
    const baseCode = baseCodeMatch ? baseCodeMatch[1].toUpperCase() : targetCode;

    // Nếu chính lá bài này là một biến thể, thêm lá bài gốc vào danh sách tham chiếu
    if (baseCode.toLowerCase() !== targetCode.toLowerCase()) {
      refCodesSet.add(baseCode);
    }

    // Thêm các biến thể anh em cùng lá bài gốc (ví dụ: 03MT056T1, 03MT056T2...)
    for (const cd of cards) {
      if (
        cd.cardCode &&
        cd.cardCode.toUpperCase().startsWith(baseCode) &&
        cd.cardCode.toLowerCase() !== targetCode.toLowerCase() &&
        /^\d{2}[A-Z]{2}\d{3}T\d+$/i.test(cd.cardCode)
      ) {
        refCodesSet.add(cd.cardCode);
      }
    }

    // Nạp đầy đủ thông tin các lá bài tham chiếu
    const associatedCards = [];
    const finalAssociatedRefs = [];

    for (const refCode of refCodesSet) {
      const foundCard = cards.find(
        (cd) => cd.cardCode?.toLowerCase() === refCode.toLowerCase()
      );
      if (foundCard) {
        finalAssociatedRefs.push(foundCard.cardCode);
        associatedCards.push({
          cardCode: foundCard.cardCode,
          cardName: foundCard.cardName,
          cost: foundCard.cost,
          attack: foundCard.attack,
          health: foundCard.health,
          type: foundCard.type,
          supertype: foundCard.supertype,
          rarity: foundCard.rarity,
          spellSpeed: foundCard.spellSpeed,
          descriptionRaw: foundCard.descriptionRaw,
          regions: foundCard.regions || [],
          gameAbsolutePath: foundCard.gameAbsolutePath,
          assetAbsolutePath: foundCard.assetAbsolutePath,
          translations: foundCard.translations || null,
          isBaseCard: foundCard.cardCode.toUpperCase() === baseCode && targetCode.toUpperCase() !== baseCode,
          isVariant: /^\d{2}[A-Z]{2}\d{3}T\d+$/i.test(foundCard.cardCode || '')
        });
      }
    }

    // Sắp xếp: Bản gốc trước tiên (nếu lá bài hiện tại là biến thể), sau đó đến các biến thể T1, T2...
    associatedCards.sort((a, b) => {
      if (a.isBaseCard) return -1;
      if (b.isBaseCard) return 1;
      return a.cardCode.localeCompare(b.cardCode, undefined, { numeric: true });
    });

    const enriched = {
      ...card,
      associatedCardRefs: finalAssociatedRefs,
      associatedCards,
      totalAssociatedCards: associatedCards.length,
      compatibleChampions,
      totalChampions: compatibleChampions.length
    };

    return fields ? pickFields(enriched, fields, 'cardCode') : enriched;
  }
};
