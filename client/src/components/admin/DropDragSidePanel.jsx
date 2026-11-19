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
    <div className="w-full h-full flex flex-col font-sans select-none overflow-hidden bg-[#13151b] border-l border-white/[0.08]">
      {/* 1. Header */}
      <div className="p-3 border-b border-white/[0.08] flex items-center justify-between bg-[#101216] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-[#1d212b] border border-white/10 text-sky-400 flex items-center justify-center text-xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 7V4h4v3a4 4 0 0 0 8 0V4h4v3a8 8 0 0 1-16 0z" />
            </svg>
          </span>
          <div>
            <h3 className="font-semibold text-xs text-slate-100">
              Menu kéo thả
            </h3>
            <span className="text-[10px] text-slate-400">Kéo sang ô bên trái hoặc bấm (+)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs"
          title="Đóng bảng kéo thả"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="grid grid-cols-5 p-1 bg-[#161920] border-b border-white/[0.08] text-xs font-medium gap-1 shrink-0">
        {[
          { id: 'relics', label: 'Cổ vật', count: relics.length },
          { id: 'powers', label: 'Sức mạnh', count: powers.length },
          { id: 'bonusStars', label: 'Chòm sao', count: bonusStars.length },
          { id: 'items', label: 'Vật phẩm', count: items.length },
          { id: 'cards', label: 'Thẻ bài', count: cards.length }
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
              className={`py-1.5 px-0.5 rounded-md flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#222634] text-slate-100 border border-white/10 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] truncate max-w-full">{tab.label}</span>
              <span className={`text-[9px] font-mono ${isActive ? 'text-sky-300' : 'text-slate-500'}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="p-3 space-y-2 border-b border-white/[0.08] bg-[#13151b] shrink-0">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm theo tên ${activeTab === 'relics' ? 'cổ vật' : activeTab === 'powers' ? 'sức mạnh' : activeTab === 'bonusStars' ? 'ngôi sao' : '...'}`}
            className="w-full px-3 py-1.5 pl-8 rounded-lg bg-[#1a1d26] border border-white/10 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-colors"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
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
              { id: 'epic', label: 'Sử thi' },
              { id: 'legendary', label: 'Huyền thoại' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRarityFilter(r.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors cursor-pointer ${
                  rarityFilter === r.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-[#1a1d26] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
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
              { id: 'bonusStarGem', label: 'Thượng giới (Đá quý)' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRarityFilter(r.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors cursor-pointer ${
                  rarityFilter === r.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-[#1a1d26] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Tìm thấy: <strong className="text-slate-200 font-mono">{currentList.length}</strong></span>
          <span className="text-[10px] text-slate-500">Kéo sang ô bên trái</span>
        </div>
      </div>

      {/* 4. Draggable Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
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
            let rarityBadgeClass = 'bg-white/[0.06] text-slate-400 border border-white/10';
            if (rawRarity.includes('rare') || rawRarity.includes('hiếm')) {
              rarityBadgeClass = 'bg-blue-500/10 text-blue-300 border border-blue-500/20';
            } else if (rawRarity.includes('epic') || rawRarity.includes('sử thi')) {
              rarityBadgeClass = 'bg-purple-500/10 text-purple-300 border border-purple-500/20';
            } else if (rawRarity.includes('legendary') || rawRarity.includes('huyền thoại')) {
              rarityBadgeClass = 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
            }

            return (
              <div
                key={code}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="group p-2 rounded-lg bg-[#181b23] hover:bg-[#20242f] border border-white/[0.08] hover:border-sky-500/40 transition-colors cursor-grab active:cursor-grabbing flex items-center gap-2.5"
                title={`Kéo thả "${name}" vào ô bên trái`}
              >
                {/* Artwork Thumbnail */}
                <div className="w-9 h-9 rounded-md bg-[#101216] border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => handleImageError(e, activeTab === 'relics' ? 'relic' : activeTab === 'powers' ? 'power' : activeTab === 'items' ? 'item' : 'card')}
                    />
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">{code.slice(0, 3)}</span>
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs text-slate-200 truncate block group-hover:text-sky-300 transition-colors">
                    {name}
                  </span>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {activeTab === 'bonusStars' ? (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ${
                        item.nodeType === 'bonusStarGem'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      }`}>
                        {item.nodeType === 'bonusStarGem' ? 'Thượng giới' : 'Bonus star'}
                      </span>
                    ) : item.rarity ? (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ${rarityBadgeClass}`}>
                        {item.rarity}
                      </span>
                    ) : null}
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">
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
                    className="p-1 rounded-md bg-white/[0.04] hover:bg-sky-500 hover:text-slate-950 text-slate-400 transition-colors cursor-pointer text-xs shrink-0"
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
                    className="p-1 rounded-md bg-white/[0.04] hover:bg-sky-500 hover:text-slate-950 text-slate-400 transition-colors cursor-pointer text-xs shrink-0"
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
                    className="p-1 rounded-md bg-white/[0.04] hover:bg-sky-500 hover:text-slate-950 text-slate-400 transition-colors cursor-pointer text-xs shrink-0"
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
      <div className="p-2 border-t border-white/[0.08] bg-[#101216] text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Kéo thả hoặc bấm (+) để gán</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Ẩn menu
        </button>
      </div>
    </div>
  );
}
