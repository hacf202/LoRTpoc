import React, { useState, useMemo } from 'react';
import { rankSearchResults } from '../../utils/searchUtils';
import { handleImageError } from '../../utils/imageFallback';

/**
 * DropDragSidePanel - Menu kéo thả tài nguyên cho Admin Panel
 * Hỗ trợ kéo thả Cổ vật (Relics), Sức mạnh (Powers), Vật phẩm (Items), Thẻ bài (Cards)
 * vào các ô trang bị và danh sách lựa chọn của tướng.
 * Tiêu chuẩn tìm kiếm: Khử dấu 100%, tìm cả Việt - Anh, ưu tiên độ tương thích cao & ngắn nhất lên đầu.
 */
export default function DropDragSidePanel({
  isOpen = false,
  onClose,
  relics = [],
  powers = [],
  bonusStars = [],
  items = [],
  cards = [],
  onQuickAssignRelic, // (relicCode) => void
  onQuickAssignPower, // (powerCode) => void
  onQuickAssignItem // (itemCode) => void
}) {
  const [activeTab, setActiveTab] = useState('relics'); // 'relics' | 'powers' | 'bonusStars' | 'items' | 'cards'
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');

  // Lấy danh sách hiển thị theo tab hiện tại
  const currentList = useMemo(() => {
    let list = [];
    if (activeTab === 'relics') list = relics;
    else if (activeTab === 'powers') list = powers;
    else if (activeTab === 'bonusStars') list = bonusStars;
    else if (activeTab === 'items') list = items;
    else if (activeTab === 'cards') list = cards;

    // 1. Lọc theo độ hiếm hoặc loại node (cho bonusStars)
    if (rarityFilter !== 'all') {
      if (activeTab === 'bonusStars') {
        list = list.filter((item) => (item.nodeType || '').toLowerCase() === rarityFilter.toLowerCase());
      } else {
        list = list.filter((item) => {
          const rawRarity = (item.rarity || item.translations?.en?.rarity || '').toLowerCase();
          return (
            (rarityFilter === 'common' && (rawRarity.includes('common') || rawRarity.includes('thường'))) ||
            (rarityFilter === 'rare' && (rawRarity.includes('rare') || rawRarity.includes('hiếm'))) ||
            (rarityFilter === 'epic' && (rawRarity.includes('epic') || rawRarity.includes('sử thi'))) ||
            (rarityFilter === 'legendary' && (rawRarity.includes('legendary') || rawRarity.includes('huyền thoại')))
          );
        });
      }
    }

    // 2. Tìm kiếm không dấu & Xếp hạng độ tương thích cao nhất + Càng ngắn càng lên đầu
    const q = search.trim();
    if (!q) return list;

    return rankSearchResults(list, q, (item) => ({
      nameVi: item.name || item.cardName || '',
      nameEn: item.translations?.en?.cardName || item.translations?.en?.name || '',
      code: item.bonusStarID || item.relicCode || item.powerCode || item.itemCode || item.cardCode || '',
      desc: item.descriptionRaw || item.description || ''
    }));
  }, [activeTab, relics, powers, bonusStars, items, cards, search, rarityFilter]);

  // Bắt đầu kéo (Drag Start)
  const handleDragStart = (e, item) => {
    const code =
      activeTab === 'relics'
        ? item.relicCode || item.code
        : activeTab === 'powers'
        ? item.powerCode || item.code
        : activeTab === 'bonusStars'
        ? item.bonusStarID || item.code
        : activeTab === 'items'
        ? item.itemCode || item.code
        : item.cardCode || item.code || '';

    const dragPayload = {
      type:
        activeTab === 'relics'
          ? 'relic'
          : activeTab === 'powers'
          ? 'power'
          : activeTab === 'bonusStars'
          ? 'bonusStar'
          : activeTab === 'items'
          ? 'item'
          : 'card',
      code,
      id: code,
      name: item.name || item.cardName || '',
      powerCode: item.powerCode,
      bonusStarID: item.bonusStarID,
      nodeType: item.nodeType || (activeTab === 'powers' ? 'starPower' : 'bonusStar'),
      description: item.descriptionRaw || item.description || '',
      image: item.image || item.assetFullAbsolutePath || item.gameAbsolutePath || ''
    };
    const jsonStr = JSON.stringify(dragPayload);
    e.dataTransfer.setData('application/json', jsonStr);
    // QUAN TRỌNG: text/plain phải là mã code thuần (VD: R0080) thay vì chuỗi JSON,
    // giúp kéo thả vào ô nhập input chuẩn xác và không bị dính nguyên JSON payload thô.
    e.dataTransfer.setData('text/plain', code);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col font-sans select-none overflow-hidden bg-[#0a0e17]">
      {/* 1. Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#121824] to-[#0a0e17] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#8CC0EB] text-[#07090e] font-black flex items-center justify-center text-sm shadow">
            🧲
          </span>
          <div>
            <h3 className="font-heading font-black text-xs text-white uppercase tracking-wider">
              Menu Kéo Thả
            </h3>
            <span className="text-[10px] text-amber-300 font-medium">Kéo thả vào ô bên trái hoặc bấm (+)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer text-xs font-bold"
          title="Đóng bảng kéo thả"
        >
          ✕
        </button>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="grid grid-cols-5 p-1.5 bg-[#06080d] border-b border-white/10 text-xs font-heading font-bold gap-1 shrink-0">
        {[
          { id: 'relics', label: 'Cổ Vật', icon: '💎', count: relics.length },
          { id: 'powers', label: 'Sức Mạnh', icon: '⚡', count: powers.length },
          { id: 'bonusStars', label: 'Chòm Sao', icon: '⭐', count: bonusStars.length },
          { id: 'items', label: 'Vật Phẩm', icon: '📦', count: items.length },
          { id: 'cards', label: 'Thẻ Bài', icon: '🃏', count: cards.length }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setRarityFilter('all');
              }}
              className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#8CC0EB] text-[#07090e] shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="text-[9px] sm:text-[10px] truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="p-3 space-y-2 border-b border-white/10 bg-[#0c111c] shrink-0">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm theo tên ${activeTab === 'relics' ? 'cổ vật' : activeTab === 'powers' ? 'sức mạnh' : activeTab === 'bonusStars' ? 'ngôi sao' : '...'}`}
            className="w-full px-3 py-2 pl-8 rounded-xl bg-[#06080d] border border-white/20 text-white text-xs focus:outline-none focus:border-[#8CC0EB] transition-colors"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Rarity Pills (áp dụng cho Relics, Powers & BonusStars) */}
        {(activeTab === 'relics' || activeTab === 'powers') && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'common', label: 'Thường' },
              { id: 'rare', label: 'Hiếm' },
              { id: 'epic', label: 'Sử Thi' },
              { id: 'legendary', label: 'H.Thoại' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRarityFilter(r.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  rarityFilter === r.id
                    ? 'bg-[#8CC0EB] text-[#07090e]'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'bonusStars' && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'bonusStar', label: 'Bonus Star (Thường)' },
              { id: 'bonusStarGem', label: 'Thượng Giới (Đá Quý)' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRarityFilter(r.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  rarityFilter === r.id
                    ? 'bg-[#8CC0EB] text-[#07090e]'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Tìm thấy: <strong className="text-white font-mono">{currentList.length}</strong></span>
          <span className="text-[10px] text-amber-300/80">Kéo sang ô bên trái</span>
        </div>
      </div>

      {/* 4. Draggable Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {currentList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Không tìm thấy kết quả phù hợp.
          </div>
        ) : (
          currentList.map((item, idx) => {
            const code = item.bonusStarID || item.relicCode || item.powerCode || item.itemCode || item.cardCode || `item-${idx}`;
            const name = item.name || item.cardName || code;
            const imageUrl =
              item.image ||
              item.assetFullAbsolutePath ||
              item.gameAbsolutePath ||
              (activeTab === 'bonusStars' ? (item.nodeType === 'bonusStarGem' ? 'https://images.lortpoc.com/icon/celestialStarIcon.webp' : 'https://images.lortpoc.com/icon/starIcon.webp') : null) ||
              (activeTab === 'relics' ? `https://images.lortpoc.com/relics/${code}.webp` : null);

            const rawRarity = (item.rarity || item.translations?.en?.rarity || '').toLowerCase();
            let rarityBadgeClass = 'bg-slate-800 text-slate-300';
            if (rawRarity.includes('rare') || rawRarity.includes('hiếm')) {
              rarityBadgeClass = 'bg-blue-950 text-blue-300 border border-blue-500/40';
            } else if (rawRarity.includes('epic') || rawRarity.includes('sử thi')) {
              rarityBadgeClass = 'bg-purple-950 text-purple-300 border border-purple-500/40';
            } else if (rawRarity.includes('legendary') || rawRarity.includes('huyền thoại')) {
              rarityBadgeClass = 'bg-amber-950 text-amber-300 border border-amber-500/40';
            }

            return (
              <div
                key={code}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="group p-2.5 rounded-xl bg-[#0e1422] hover:bg-[#151e33] border border-white/10 hover:border-[#8CC0EB] transition-all cursor-grab active:cursor-grabbing flex items-center gap-3 shadow-sm hover:shadow-md"
                title={`Kéo thả "${name}" vào ô bên trái`}
              >
                {/* Artwork Thumbnail (Icon to rõ) */}
                <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/15 p-1 shrink-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => handleImageError(e, activeTab === 'relics' ? 'relic' : activeTab === 'powers' ? 'power' : activeTab === 'items' ? 'item' : 'card')}
                    />
                  ) : (
                    <span className="text-lg">{activeTab === 'relics' ? '💎' : activeTab === 'powers' ? '⚡' : activeTab === 'bonusStars' ? '⭐' : '📦'}</span>
                  )}
                </div>

                {/* Info Text: CHỈ HIỆN TÊN VÀ MÔ TẢ (KHÔNG HIỆN MÃ CODE) */}
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-xs text-white truncate block group-hover:text-[#8CC0EB] transition-colors">
                    {name}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    {activeTab === 'bonusStars' ? (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                        item.nodeType === 'bonusStarGem'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-sky-950 text-sky-300 border border-sky-500/40'
                      }`}>
                        {item.nodeType === 'bonusStarGem' ? 'Thượng Giới' : 'Bonus Star'}
                      </span>
                    ) : item.rarity ? (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${rarityBadgeClass}`}>
                        {item.rarity}
                      </span>
                    ) : null}
                    <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                      {item.descriptionRaw || item.description || ''}
                    </p>
                  </div>
                </div>

                {/* Quick Action Button */}
                {onQuickAssignRelic && activeTab === 'relics' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAssignRelic(code);
                    }}
                    className="p-1.5 rounded-lg bg-[#8CC0EB]/20 hover:bg-[#8CC0EB] text-[#8CC0EB] hover:text-[#07090e] transition-all cursor-pointer font-bold text-xs shrink-0"
                    title={`Gán nhanh "${name}" vào slot trống`}
                  >
                    +
                  </button>
                )}
                {onQuickAssignPower && activeTab === 'powers' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAssignPower(code);
                    }}
                    className="p-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black transition-all cursor-pointer font-bold text-xs shrink-0"
                    title={`Gán nhanh sức mạnh "${name}"`}
                  >
                    +
                  </button>
                )}
                {onQuickAssignItem && activeTab === 'items' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAssignItem(code);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-400/20 hover:bg-emerald-400 text-emerald-300 hover:text-black transition-all cursor-pointer font-bold text-xs shrink-0"
                    title={`Gán nhanh vật phẩm "${name}"`}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer Instructions */}
      <div className="p-2.5 border-t border-white/10 bg-[#06080d] text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400">💡</span> Kéo thả hoặc bấm (+)
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer underline"
        >
          Ẩn Menu
        </button>
      </div>
    </div>
  );
}
