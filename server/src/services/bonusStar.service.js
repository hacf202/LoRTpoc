import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickFields, pickListFields } from '../utils/fieldPicker.js';
import { loadCollectionFromDb } from '../config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bonusStarsFilePath = path.join(__dirname, '../data/bonusStars.json');

let bonusStars = [];
try {
  if (fs.existsSync(bonusStarsFilePath)) {
    bonusStars = JSON.parse(fs.readFileSync(bonusStarsFilePath, 'utf8'));
  }
} catch (err) {
  console.error('Failed to load bonusStars dataset:', err.message);
}

export const bonusStarService = {
  loadFromDb: async () => {
    const data = await loadCollectionFromDb('bonusStars', 'bonusStars.json');
    if (Array.isArray(data) && data.length > 0) {
      bonusStars = data;
      console.log(`[BonusStarService] Loaded ${bonusStars.length} bonus stars from MongoDB.`);
    }
    return bonusStars;
  },

  getAll: async (filter = {}) => {
    let result = [...bonusStars];

    if (filter.type || filter.nodeType) {
      const targetType = (filter.type || filter.nodeType).toLowerCase().trim();
      result = result.filter((item) => (item.nodeType || '').toLowerCase() === targetType);
    }

    if (filter.search || filter.q) {
      const q = (filter.search || filter.q).toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(q) ||
          (item.bonusStarID || '').toLowerCase().includes(q) ||
          (item.descriptionRaw || '').toLowerCase().includes(q) ||
          (item.translations?.en?.name || '').toLowerCase().includes(q)
      );
    }

    if (filter.limit && filter.limit !== 'all') {
      const limit = parseInt(filter.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        result = result.slice(0, limit);
      }
    }

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'bonusStarID');
    }

    return result;
  },

  getById: async (id, fields = null) => {
    const cleanId = String(id).toLowerCase().trim();
    const item = bonusStars.find(
      (b) =>
        b.bonusStarID?.toLowerCase() === cleanId ||
        b.name?.toLowerCase() === cleanId
    ) || null;

    if (!item) return null;
    return fields ? pickFields(item, fields, 'bonusStarID') : item;
  }
};
