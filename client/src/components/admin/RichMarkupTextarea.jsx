import React, { useState, useRef, useEffect, useMemo } from 'react';
import LorMarkup from '../LorMarkup';
import { removeVietnameseTones, calculateFieldScore } from '../../utils/searchUtils';

/**
 * Tính điểm độ tương thích (Relevance Score) giữa từ khóa và thực thể:
 * 1. Khớp chính xác hoàn toàn (Exact Match) -> 10,000 điểm
 * 2. Khớp tiền tố (Prefix Match - Bắt đầu bằng từ khóa) -> 6,000 điểm
 * 3. Khớp ở đầu một từ (Word Boundary Match) -> 3,500 điểm
 * 4. Chứa chuỗi con (Substring Match) -> 1,500 điểm
 * 5. ƯU TIÊN CAO: Càng ít chữ càng ngắn -> Càng được đưa lên trên (trừ điểm theo độ dài)
 */
const calculateMatchScore = (item, rawQuery) => {
  const q = removeVietnameseTones(rawQuery);
  if (!q) return 0;

  const nameViScore = calculateFieldScore(item.name, q);
  const nameEnScore = calculateFieldScore(item.nameEn, q);
  const idScore = calculateFieldScore(item.id, q);

  let matchQuality = Math.max(
    nameViScore,
    nameEnScore > 0 ? nameEnScore - 100 : 0,
    idScore > 0 ? idScore - 200 : 0
  );

  // Hỗ trợ tìm kiếm kết hợp nhiều từ khóa (ví dụ: "Aatrox T3", "Darkin T1")
  if (matchQuality === 0 && q.includes(' ')) {
    const tokens = q.split(/\s+/).filter(Boolean);
    const normVi = removeVietnameseTones(item.name);
    const normEn = removeVietnameseTones(item.nameEn);
    const normId = removeVietnameseTones(item.id);

    const allMatched = tokens.every((tok) =>
      normVi.includes(tok) || normEn.includes(tok) || normId.includes(tok)
    );

    if (allMatched) {
      matchQuality = 2000;
      if (tokens.some((tok) => /^t\d+$/i.test(tok) && normId.endsWith(tok))) {
        matchQuality += 1500;
      }
    }
  }

  if (matchQuality === 0) return 0;

  // 5. ƯU TIÊN ĐẶC BIỆT: Càng ít chữ càng ngắn -> Càng đứng trên
  const nameLength = (item.name || '').length;
  const wordCount = (item.name || '').trim().split(/\s+/).filter(Boolean).length;
  const lengthPenalty = (nameLength * 4) + (wordCount * 20);

  // Cộng nhẹ bonus ưu tiên cho Cổ vật & Sức mạnh trong cẩm nang
  let typeBonus = 0;
  if (item.type === 'r') typeBonus = 60;
  else if (item.type === 'p') typeBonus = 50;
  else if (item.type === 'c') typeBonus = 40;
  else if (item.type === 'i') typeBonus = 30;
  else if (item.type === 'cd') typeBonus = 20;

  return matchQuality - lengthPenalty + typeBonus;
};

/**
 * RichMarkupTextarea - Trình soạn thảo văn bản hỗ trợ LoR Rich Markup & Autocomplete '@'
 * - Tự động nhận diện và chuẩn hóa ký tự xuống dòng '\n'
 * - Gõ '@' để hiển thị menu gợi ý chèn Cổ vật [r:...], Sức mạnh [p:...], Tướng [c:...], v.v.
 * - Hỗ trợ thanh công cụ: In đậm <b>, In nghiêng <i>, phím tắt, và Live Preview trực tiếp.
 */
export default function RichMarkupTextarea({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung mô tả... (Gõ @ để gắn thẻ Cổ vật, Sức mạnh)',
  rows = 4,
  label = '',
  relics = [],
  powers = [],
  champions = [],
  items = [],
  cards = []
}) {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Chuẩn hóa \n: chuyển các chuỗi escape literal "\\n" thành ký tự xuống dòng thực tế "\n"
  const safeText = useMemo(() => {
    if (typeof value !== 'string') return '';
    return value.replace(/\\n/g, '\n');
  }, [value]);

  const [previewMode, setPreviewMode] = useState(false);

  // State Autocomplete on '@'
  const [autoActive, setAutoActive] = useState(false);
  const [autoQuery, setAutoQuery] = useState('');
  const [autoIndex, setAutoIndex] = useState(0);

  // Tổng hợp tất cả các thực thể để tìm kiếm khi gõ '@'
  const combinedEntities = useMemo(() => {
    const list = [];

    // 1. Cổ vật (Relics)
    (relics || []).forEach((r) => {
      const code = r.relicCode || '';
      const name = r.name || code;
      const nameEn = r.translations?.en?.name || '';
      list.push({
        type: 'r',
        typeName: 'Cổ Vật',
        icon: '💎',
        id: code,
        name,
        nameEn,
        image: r.image || `https://images.lortpoc.com/relics/${code}.webp`
      });
    });

    // 2. Sức mạnh (Powers)
    (powers || []).forEach((p) => {
      const code = p.powerCode || '';
      const name = p.name || code;
      const nameEn = p.translations?.en?.name || '';
      list.push({
        type: 'p',
        typeName: 'Sức Mạnh',
        icon: '⚡',
        id: code,
        name,
        nameEn,
        image: p.image || p.assetFullAbsolutePath || ''
      });
    });

    // 3. Tướng (Champions)
    (champions || []).forEach((c) => {
      const id = c.championID || c.cardCode || '';
      const name = c.name || id;
      const nameEn = c.translations?.en?.name || '';
      list.push({
        type: 'c',
        typeName: 'Tướng',
        icon: '⚔️',
        id,
        name,
        nameEn,
        image: c.assets?.[0]?.avatar || ''
      });
    });

    // 4. Vật phẩm (Items)
    (items || []).forEach((it) => {
      const code = it.itemCode || '';
      const name = it.name || code;
      const nameEn = it.translations?.en?.name || '';
      list.push({
        type: 'i',
        typeName: 'Vật Phẩm',
        icon: '📦',
        id: code,
        name,
        nameEn,
        image: it.image || ''
      });
    });

    // 5. Thẻ bài (Cards)
    (cards || []).forEach((cd) => {
      const code = cd.cardCode || '';
      const name = cd.cardName || cd.name || code;
      const nameEn = cd.translations?.en?.cardName || cd.translations?.en?.name || '';
      list.push({
        type: 'cd',
        typeName: 'Thẻ Bài',
        icon: '🃏',
        id: code,
        name,
        nameEn,
        image: cd.gameAbsolutePath || cd.assetAbsolutePath || ''
      });
    });

    return list;
  }, [relics, powers, champions, items, cards]);

  // Lọc và xếp hạng gợi ý thông minh khi gõ '@'
  const suggestions = useMemo(() => {
    if (!autoActive) return [];
    const q = autoQuery.trim();

    if (!q) {
      // Khi vừa gõ '@' chưa nhập từ khóa: ưu tiên hiển thị cổ vật & sức mạnh ngắn gọn nhất
      return [...combinedEntities]
        .sort((a, b) => (a.name || '').length - (b.name || '').length)
        .slice(0, 10);
    }

    const scored = [];
    for (let i = 0; i < combinedEntities.length; i++) {
      const item = combinedEntities[i];
      const score = calculateMatchScore(item, q);
      if (score > 0) {
        scored.push({ item, score });
      }
    }

    // Sắp xếp theo điểm tương thích cao nhất trước (Best Match & Càng ít chữ càng ngắn)
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 10).map((s) => s.item);
  }, [autoActive, autoQuery, combinedEntities]);

  // Đổi giá trị và cập nhật con trỏ
  const updateText = (newVal, cursorOffset) => {
    if (onChange) {
      onChange(newVal);
    }
    if (cursorOffset !== undefined) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(cursorOffset, cursorOffset);
        }
      }, 0);
    }
  };

  // Áp dụng gợi ý từ autocomplete
  const applySuggestion = (index) => {
    const selected = suggestions[index];
    if (!selected || !textareaRef.current) return;

    const el = textareaRef.current;
    const cursorPos = el.selectionStart;
    const textBeforeCursor = safeText.substring(0, cursorPos);
    const triggerMatch = textBeforeCursor.match(/@([^@\n,\[\]|]{0,35})$/);

    if (!triggerMatch) return;

    const matchLen = triggerMatch[0].length; // Bao gồm cả ký tự '@'
    const replaceStart = cursorPos - matchLen;

    const before = safeText.substring(0, replaceStart);
    const after = safeText.substring(cursorPos);

    // Cú pháp LoR Markup chuẩn: [type:id|name]
    const tag = `[${selected.type}:${selected.id}|${selected.name}]`;
    const newText = before + tag + after;

    updateText(newText, before.length + tag.length);
    setAutoActive(false);
    setAutoIndex(0);
  };

  // Bắt sự kiện khi gõ vào textarea
  const handleTextareaChange = (e) => {
    const newVal = e.target.value;
    updateText(newVal);

    // Kiểm tra ký tự '@' ngay trước con trỏ chuột
    const cursorPos = e.target.selectionStart;
    const textBefore = newVal.substring(0, cursorPos);
    const match = textBefore.match(/@([^@\n,\[\]|]{0,35})$/);

    if (match) {
      setAutoQuery(match[1]);
      setAutoActive(true);
      setAutoIndex(0);
    } else {
      setAutoActive(false);
    }
  };

  // Xử lý phím mũi tên & Enter khi mở popup gợi ý '@'
  const handleKeyDown = (e) => {
    if (autoActive && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutoIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutoIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(autoIndex);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setAutoActive(false);
        return;
      }
    }
  };

  // Nút in đậm <b>...</b>
  const handleBold = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selText = safeText.substring(start, end);

    if (selText) {
      const wrapped = `<b>${selText}</b>`;
      const next = safeText.substring(0, start) + wrapped + safeText.substring(end);
      updateText(next, start + wrapped.length);
    } else {
      const wrapped = `<b>văn bản</b>`;
      const next = safeText.substring(0, start) + wrapped + safeText.substring(end);
      updateText(next, start + 3 + 7);
    }
  };

  // Nút in nghiêng <i>...</i>
  const handleItalic = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selText = safeText.substring(start, end);

    if (selText) {
      const wrapped = `<i>${selText}</i>`;
      const next = safeText.substring(0, start) + wrapped + safeText.substring(end);
      updateText(next, start + wrapped.length);
    } else {
      const wrapped = `<i>văn bản</i>`;
      const next = safeText.substring(0, start) + wrapped + safeText.substring(end);
      updateText(next, start + 3 + 7);
    }
  };

  // Nút chèn ký tự xuống dòng '\n'
  const handleInsertNewline = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = safeText.substring(0, start) + '\n' + safeText.substring(end);
    updateText(next, start + 1);
  };

  // Nút chèn '@'
  const handleTriggerAt = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = safeText.substring(0, start) + '@' + safeText.substring(end);
    updateText(next, start + 1);
    setAutoQuery('');
    setAutoActive(true);
    setAutoIndex(0);
  };

  return (
    <div className="space-y-1.5 font-sans relative">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
        {label && (
          <label className="block text-xs font-bold text-slate-300">
            {label}
          </label>
        )}

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleBold}
            className="px-2 py-1 rounded bg-[#141b2a] hover:bg-white/10 text-slate-300 hover:text-white text-xs font-black transition-colors cursor-pointer border border-white/10"
            title="In đậm <b>...</b>"
          >
            B
          </button>

          <button
            type="button"
            onClick={handleItalic}
            className="px-2 py-1 rounded bg-[#141b2a] hover:bg-white/10 text-slate-300 hover:text-white text-xs italic font-serif transition-colors cursor-pointer border border-white/10"
            title="In nghiêng <i>...</i>"
          >
            I
          </button>

          <button
            type="button"
            onClick={handleInsertNewline}
            className="px-2 py-1 rounded bg-[#141b2a] hover:bg-white/10 text-amber-300 hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer border border-white/10"
            title="Chèn xuống dòng (\n)"
          >
            ↵ \n
          </button>

          <button
            type="button"
            onClick={handleTriggerAt}
            className="px-2.5 py-1 rounded bg-[#0b2545] hover:bg-sky-600 text-sky-200 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-sky-400/50 flex items-center gap-1"
            title="Gắn thẻ bằng @"
          >
            <span>@</span>
            <span className="text-[10px]">Gắn thẻ</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              previewMode
                ? 'bg-[#e6b758] text-[#07090e] border-[#e6b758]'
                : 'bg-[#141b2a] hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            title="Bật/Tắt chế độ xem trước trực tiếp (Live Preview)"
          >
            <span>{previewMode ? '✏️ Soạn Thảo' : '👁️ Xem Trước'}</span>
          </button>
        </div>
      </div>

      {/* 2. Textarea or Live Preview */}
      <div className="relative">
        {previewMode ? (
          <div
            className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070a10] border border-[#e6b758]/50 text-white text-xs leading-relaxed min-h-[${rows * 24}px] overflow-y-auto whitespace-pre-line`}
            style={{ minHeight: `${rows * 26}px` }}
          >
            {safeText ? (
              <LorMarkup text={safeText} />
            ) : (
              <span className="text-slate-500 italic">Chưa có nội dung để hiển thị xem trước.</span>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={safeText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a10] border border-white/15 text-white text-xs leading-relaxed focus:border-[#e6b758] focus:outline-none transition-colors font-sans"
          />
        )}

        {/* 3. Floating Autocomplete Dropdown khi gõ '@' */}
        {autoActive && suggestions.length > 0 && !previewMode && (
          <div
            ref={dropdownRef}
            className="absolute left-2 z-50 bottom-full mb-1.5 w-72 sm:w-80 max-h-64 overflow-y-auto rounded-xl bg-[#0d1320] border-2 border-[#e6b758] shadow-[0_10px_30px_rgba(0,0,0,0.9)] p-1.5 space-y-1"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e6b758] border-b border-white/10 flex items-center justify-between">
              <span>Gợi ý chèn thực thể LoR (@)</span>
              <span className="text-slate-400 font-normal">Enter hoặc Click để chèn</span>
            </div>

            {suggestions.map((item, idx) => {
              const isSelected = idx === autoIndex;
              return (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Tránh làm mất focus textarea
                    applySuggestion(idx);
                  }}
                  className={`p-2 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#e6b758] text-[#07090e]'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  {/* Icon Thumbnail */}
                  <div className="w-7 h-7 rounded bg-black/60 border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs">{item.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-xs truncate block">
                        {item.name}
                      </span>
                      {item.nameEn && item.nameEn.toLowerCase() !== item.name.toLowerCase() && (
                        <span className="text-[10px] opacity-75 italic truncate">
                          ({item.nameEn})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] opacity-80 mt-0.5">
                      <span className="font-semibold">{item.typeName}</span>
                      <span>•</span>
                      <span className="font-mono text-[9px] bg-black/20 px-1 py-0.2 rounded">{item.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Tips caption */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
        <span>Gõ <strong className="text-amber-300">@</strong> để gắn thẻ Cổ vật / Sức mạnh / Tướng</span>
        <span className="text-slate-400 font-mono">Nhận diện \n và Enter</span>
      </div>
    </div>
  );
}
