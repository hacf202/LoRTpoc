/**
 * Unified Search & Relevance Ranking Engine (Backend Node.js)
 * Legends of Runeterra: The Path of Champions Guide
 *
 * Tiêu chuẩn bất di bất dịch toàn dự án:
 * 1. Khử dấu tiếng Việt 100% (chuẩn NFD + đ/Đ -> d)
 * 2. Tìm kiếm song song cả tiếng Việt và tiếng Anh (nameVi, nameEn, code, id)
 * 3. Thuật toán xếp hạng ưu tiên (Relevance Scoring):
 *    - Khớp chính xác (Exact match): 10,000
 *    - Khớp tiền tố (Prefix match): 6,000
 *    - Khớp đầu từ (Word boundary): 3,500
 *    - Khớp chuỗi con (Substring): 1,500
 * 4. QUY TẮC VÀNG: "Càng ít chữ càng ngắn lên đầu" (Length penalty)
 */

export const removeVietnameseTones = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
};

export const normalizeSearchText = removeVietnameseTones;

export const matchSearchQuery = (targetText, query) => {
  if (!query) return true;
  if (!targetText) return false;

  const cleanTarget = removeVietnameseTones(String(targetText));
  const cleanQuery = removeVietnameseTones(String(query));

  return cleanTarget.includes(cleanQuery);
};

export const calculateFieldScore = (fieldValue, normalizedQuery) => {
  if (!fieldValue || !normalizedQuery) return 0;
  const normVal = removeVietnameseTones(String(fieldValue));
  if (!normVal) return 0;

  if (normVal === normalizedQuery) return 10000;
  if (normVal.startsWith(normalizedQuery)) return 6000;

  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`(?:^|\\s)${escaped}`, 'i');
  if (wordBoundaryRegex.test(normVal)) return 3500;

  if (normVal.includes(normalizedQuery)) return 1500;

  return 0;
};

export const calculateEntityScore = (item, rawQuery, fieldExtractor) => {
  const q = removeVietnameseTones(rawQuery);
  if (!q || !item) return 0;

  const fields = typeof fieldExtractor === 'function' ? fieldExtractor(item) : {
    nameVi: item.name || item.cardName || item.adventureName || '',
    nameEn: item.translations?.en?.name || item.translations?.en?.adventureName || item.enName || '',
    code: item.championID || item.cardCode || item.relicCode || item.powerCode || item.itemCode || item.adventureID || item.id || '',
    desc: item.descriptionRaw || item.description || item.translations?.en?.description || ''
  };

  const nameViScore = calculateFieldScore(fields.nameVi, q);
  const nameEnScore = calculateFieldScore(fields.nameEn, q);
  const codeScore = calculateFieldScore(fields.code, q);
  const descScore = calculateFieldScore(fields.desc, q) > 0 ? 500 : 0;

  let maxMatchQuality = Math.max(
    nameViScore,
    nameEnScore > 0 ? nameEnScore - 100 : 0,
    codeScore > 0 ? codeScore - 200 : 0,
    descScore
  );

  if (maxMatchQuality === 0) return 0;

  const displayTitle = fields.nameVi || fields.nameEn || fields.code || '';
  const length = displayTitle.length;
  const wordCount = displayTitle.trim() ? displayTitle.trim().split(/\s+/).length : 1;
  const lengthPenalty = (length * 4) + (wordCount * 20);

  return Math.max(1, maxMatchQuality - lengthPenalty);
};

export const rankSearchResults = (items, rawQuery, fieldExtractor) => {
  if (!Array.isArray(items)) return [];
  const q = removeVietnameseTones(rawQuery);
  if (!q) return items;

  const scored = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const score = calculateEntityScore(item, q, fieldExtractor);
    if (score > 0) {
      scored.push({ item, score, index: i });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  return scored.map((s) => s.item);
};
