import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { pickFields, pickListFields } from '../utils/fieldPicker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const constsFilePath = path.join(__dirname, '../data/constellations.json');

let constellations = [];
try {
  constellations = JSON.parse(fs.readFileSync(constsFilePath, 'utf8'));
} catch (err) {
  console.error('Failed to load constellations dataset:', err.message);
}

export const constellationService = {
  getAll: async (filter = {}) => {
    let result = [...constellations];

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.championName?.toLowerCase().includes(q) ||
          c.constellationID?.toLowerCase().includes(q)
      );
    }

    if (filter.limit) {
      const limit = parseInt(filter.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        result = result.slice(0, limit);
      }
    }

    if (filter.fields) {
      result = pickListFields(result, filter.fields, 'constellationID');
    }

    return result;
  },

  getById: async (id, fields = null) => {
    const cleanId = String(id).toLowerCase().trim();
    const constellation = constellations.find(
      (c) =>
        c.constellationID?.toLowerCase() === cleanId ||
        c.championName?.toLowerCase() === cleanId
    ) || null;

    if (!constellation) return null;
    return fields ? pickFields(constellation, fields, 'constellationID') : constellation;
  }
};