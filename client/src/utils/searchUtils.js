/**
 * Unified Search & Relevance Ranking Engine
 *legends-of-runeterra: The Path of Champions Guide
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

/**
 * Chuẩn hóa chuỗi tìm kiếm không dấu:
 * - Chuyển sang chữ thường
 * - Khử toàn bộ dấu thanh tiếng Việt (Unicode NFD)
 * - Khử chữ đ, Đ thành d
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

/**
 * Kiểm tra xem chuỗi đích có chứa từ khóa hay không (không phân biệt hoa thường và dấu)
 */
export const matchSearchQuery = (targetText, query) => {
  if (!query) return true;
  if (!targetText) return false;

  const cleanTarget = removeVietnameseTones(String(targetText));
  const cleanQuery = removeVietnameseTones(String(query));

  return cleanTarget.includes(cleanQuery);
};

/**
 * Tính điểm độ tương thích (Relevance Score) giữa một trường chuỗi và từ khóa tìm kiếm:
 * - 10,000: Khớp chính xác hoàn toàn (Exact Match)
 * - 6,000:  Khớp tiền tố (Bắt đầu bằng từ khóa - Prefix Match)
 * - 3,500:  Khớp đầu một từ (Word Boundary Match)
 * - 1,500:  Chứa chuỗi con (Substring Match)
 * - 0:      Không khớp
 */
export const calculateFieldScore = (fieldValue, normalizedQuery) => {
  if (!fieldValue || !normalizedQuery) return 0;
  const normVal = removeVietnameseTones(String(fieldValue));
  if (!normVal) return 0;

  if (normVal === normalizedQuery) return 10000;
  if (normVal.startsWith(normalizedQuery)) return 6000;

  // Khớp đầu từ (ví dụ "truy" khớp "Gươm Truy Tung")
  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`(?:^|\\s)${escaped}`, 'i');
  if (wordBoundaryRegex.test(normVal)) return 3500;

  if (normVal.includes(normalizedQuery)) return 1500;

  return 0;
};

/**
 * Tính điểm tổng hợp cho một thực thể (Entity) với nhiều trường dữ liệu (đa ngôn ngữ Việt/Anh/Mã):
 * @param {object} item Thực thể cần chấm điểm
 * @param {string} rawQuery Từ khóa người dùng nhập
 * @param {function|object} fieldExtractor Hàm trích xuất các trường: (item) => ({ nameVi, nameEn, code, desc })
 */
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
  const descScore = calculateFieldScore(fields.desc, q) > 0 ? 500 : 0; // Điểm phụ nếu khớp trong mô tả

  // Lấy điểm chất lượng khớp cao nhất
  // Name VI > Name EN > Code > Desc
  let maxMatchQuality = Math.max(
    nameViScore,
    nameEnScore > 0 ? nameEnScore - 100 : 0, // Ưu tiên nhẹ tiếng Việt trước tiếng Anh nếu cùng chất lượng
    codeScore > 0 ? codeScore - 200 : 0,
    descScore
  );

  // Hỗ trợ tìm kiếm nhiều từ (ví dụ: "Aatrox T3")
  if (maxMatchQuality === 0 && q.includes(' ')) {
    const tokens = q.split(/\s+/).filter(Boolean);
    const normVi = removeVietnameseTones(fields.nameVi);
    const normEn = removeVietnameseTones(fields.nameEn);
    const normCode = removeVietnameseTones(fields.code);

    const allTokensMatch = tokens.every((tok) =>
      normVi.includes(tok) || normEn.includes(tok) || normCode.includes(tok)
    );

    if (allTokensMatch) {
      maxMatchQuality = 2000;
      if (tokens.some((tok) => /^t\d+$/i.test(tok) && normCode.endsWith(tok))) {
        maxMatchQuality += 1500;
      }
    }
  }

  if (maxMatchQuality === 0) return 0;

  // PHẠT ĐỘ DÀI: Càng ít chữ càng ngắn -> Càng được ưu tiên lên đầu
  // Đo theo tên hiển thị chính (Việt hoặc Anh)
  const displayTitle = fields.nameVi || fields.nameEn || fields.code || '';
  const length = displayTitle.length;
  const wordCount = displayTitle.trim() ? displayTitle.trim().split(/\s+/).length : 1;
  const lengthPenalty = (length * 4) + (wordCount * 20);

  return Math.max(1, maxMatchQuality - lengthPenalty);
};

/**
 * Lọc và xếp hạng danh sách theo độ tương thích và quy tắc "càng ngắn càng lên đầu"
 */
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
    return a.index - b.index; // Giữ nguyên tính ổn định (stable sort)
  });

  return scored.map((s) => s.item);
};
