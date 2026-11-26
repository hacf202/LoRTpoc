import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from 'react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  X,
  RotateCw,
  Download,
  Palette,
  Trash2,
  Sparkles,
  GripVertical,
  CheckSquare,
  Square,
  Search
} from 'lucide-react';
import html2canvas from 'html2canvas';

import MultiSelectFilter from '../MultiSelectFilter';
import ConfirmModal from './ConfirmModal';
import {
  SortableItem,
  DroppableZone,
  COLOR_OPTIONS,
  RELIC_STORAGE_KEY
} from './tierListComponents';
import { sampleRelicMapping } from './relicSampleMapping';
import { useLanguage } from '../../context/LanguageContext';
import { removeVietnameseTones } from '../../utils/searchUtils';
import { handleImageError } from '../../utils/imageFallback';

// --- 0. RARITY NORMALIZER ---
const normalizeRarity = (rarity) => {
  if (!rarity) return 'THƯỜNG';
  const upper = String(rarity).toUpperCase().trim();
  if (upper === 'SỬ THI' || upper === 'EPIC') return 'SỬ THI';
  if (upper === 'HIẾM' || upper === 'RARE') return 'HIẾM';
  return 'THƯỜNG';
};

// --- 1. SKELETON ---
const RelicTierSkeleton = () => (
  <div className="max-w-[1280px] w-full mx-auto p-2 sm:p-4 animate-pulse">
    <div className="flex justify-between items-center mb-6 px-1">
      <div className="h-8 w-48 bg-slate-800 rounded" />
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-slate-800 rounded" />
        <div className="h-9 w-24 bg-slate-800 rounded" />
      </div>
    </div>
    <div className="bg-[#0b0f19] border border-white/10 rounded-xl p-1.5 space-y-1.5 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex h-20 sm:h-24 bg-white/5 rounded-lg">
          <div className="w-14 sm:w-36 bg-slate-800/50 shrink-0 rounded-l-lg" />
          <div className="flex-1 p-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div
                key={j}
                className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-800/40 rounded"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- 2. SORTABLE TIER ROW ---
const SortableTierRow = ({
  tier,
  isExporting,
  setTiers,
  tiers,
  showColorPicker,
  setShowColorPicker,
  setUnranked,
  requestConfirm,
  isEn,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tier.id, data: { type: 'tier' } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex min-h-[60px] sm:min-h-[100px] bg-black/25 group relative border-b border-white/5 last:border-none"
    >
      {!isExporting && (
        <div
          {...attributes}
          {...listeners}
          data-tier-handle="true"
          className="w-5 sm:w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 text-slate-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-none select-none"
          title={isEn ? 'Drag to reorder tier' : 'Kéo để đổi thứ tự hàng'}
        >
          <GripVertical size={18} />
        </div>
      )}

      {/* Left Tier Header */}
      <div
        style={{ backgroundColor: tier.color }}
        className="relative w-14 sm:w-36 flex flex-col items-center justify-center p-1 text-black shrink-0 select-none"
      >
        {isExporting ? (
          <div className="bg-transparent text-center w-full font-black border-none text-sm sm:text-3xl uppercase px-0">
            {tier.name}
          </div>
        ) : (
          <input
            className="bg-transparent text-center w-full font-black border-none focus:outline-none text-sm sm:text-3xl uppercase px-0 text-black placeholder-black/40"
            value={tier.name}
            onChange={(e) =>
              setTiers(
                tiers.map((t) =>
                  t.id === tier.id ? { ...t, name: e.target.value } : t
                )
              )
            }
          />
        )}

        {isExporting ? (
          <div className="bg-transparent text-center w-full text-[9px] sm:text-[11px] font-medium italic border-none opacity-70 mt-0.5 break-words">
            {tier.description}
          </div>
        ) : (
          <input
            className="bg-transparent text-center w-full text-[9px] sm:text-[11px] font-medium italic border-none focus:outline-none opacity-70 mt-0.5 text-black placeholder-black/40"
            value={tier.description || ''}
            placeholder={isEn ? 'Description' : 'Mô tả'}
            onChange={(e) =>
              setTiers(
                tiers.map((t) =>
                  t.id === tier.id ? { ...t, description: e.target.value } : t
                )
              )
            }
          />
        )}

        {!isExporting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(showColorPicker === tier.id ? null : tier.id);
            }}
            className="absolute top-1 right-1 p-1 bg-white/40 hover:bg-white/70 rounded opacity-0 group-hover:opacity-100 z-[50] transition-opacity cursor-pointer text-black"
            title={isEn ? 'Change color' : 'Đổi màu bậc'}
          >
            <Palette size={14} />
          </button>
        )}

        {showColorPicker === tier.id && !isExporting && (
          <div className="color-picker absolute top-full left-0 z-[200] mt-1 p-1 bg-[#151924] border border-white/20 rounded-lg flex gap-1 flex-wrap w-[116px] shadow-2xl">
            {COLOR_OPTIONS.map((c) => (
              <div
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  setTiers(
                    tiers.map((t) =>
                      t.id === tier.id ? { ...t, color: c } : t
                    )
                  );
                  setShowColorPicker(null);
                }}
                style={{ backgroundColor: c }}
                className="w-5 h-5 rounded-full cursor-pointer border border-white/20 hover:scale-115 transition-transform"
              />
            ))}
          </div>
        )}
      </div>

      {/* Row Items Zone */}
      {children}

      {!isExporting && (
        <button
          type="button"
          onClick={() => {
            const confirmMsg = isEn
              ? `Delete tier "${tier.name}" and return relics to warehouse?`
              : `Xóa hàng ${tier.name} và đưa toàn bộ cổ vật về kho?`;
            requestConfirm(confirmMsg, () => {
              setUnranked((prev) => [...prev, ...tier.items]);
              setTiers((prev) => prev.filter((t) => t.id !== tier.id));
            });
          }}
          className="px-1.5 sm:px-3 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 self-center transition-opacity cursor-pointer"
          title={isEn ? 'Delete row' : 'Xóa hàng'}
        >
          <X size={18} className="sm:size-7" />
        </button>
      )}
    </div>
  );
};

// --- 3. MAIN COMPONENT ---
export default function TierListRelics() {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [allRelicsRaw, setAllRelicsRaw] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [unranked, setUnranked] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Marquee selection
  const boardRectRef = useRef(null);
  const selectionDataRef = useRef({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const selectionBoxDivRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // UI state
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const requestConfirm = useCallback((message, onConfirm) => {
    setConfirmConfig({ isOpen: true, message, onConfirm });
  }, []);

  const tierListRef = useRef(null);
  const boardRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortItemsByName = useCallback(
    (items) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    []
  );

  const getDefaultTiers = useCallback(
    () => [
      {
        id: 'tier-0',
        name: '0',
        description: t('tierList.versatileStrong') || 'Đa dụng & Cực mạnh',
        color: '#ff3e3e',
        items: []
      },
      {
        id: 'tier-0-5',
        name: '0.5',
        description: t('tierList.strongSpecific') || 'Cực mạnh trong kèo cụ thể',
        color: '#ff7f7f',
        items: []
      },
      {
        id: 'tier-1',
        name: '1',
        description: t('tierList.versatile') || 'Đa dụng & Ổn định',
        color: '#ffbf7f',
        items: []
      },
      {
        id: 'tier-2',
        name: '2',
        description: t('tierList.decent') || 'Tạm được / Ít dùng',
        color: '#ffff7f',
        items: []
      },
      {
        id: 'tier-3',
        name: '3',
        description: t('tierList.weak') || 'Yếu / Kén tướng',
        color: '#7fff7f',
        items: []
      }
    ],
    [t]
  );

  const getSampleData = useCallback(
    (rawData) => {
      const usedIds = new Set();
      const sampleTiers = getDefaultTiers().map((tier) => {
        const targetIds = sampleRelicMapping[tier.id] || [];
        const items = rawData.filter((r) => targetIds.includes(r.id));
        items.forEach((i) => usedIds.add(i.id));
        return { ...tier, items };
      });
      return {
        sampleTiers,
        sampleUnranked: sortItemsByName(rawData.filter((r) => !usedIds.has(r.id)))
      };
    },
    [getDefaultTiers, sortItemsByName]
  );

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/relics?limit=all&summary=true');
        const data = await res.json();
        const rawItems = data.data || data.items || data || [];

        const formatted = sortItemsByName(
          rawItems.map((r) => ({
            id: String(r.relicCode || r.relicID || r.id),
            name: r.name,
            avatar:
              r.image ||
              `https://images.lortpoc.com/relics/${r.relicCode || r.id}.webp`,
            rarity: normalizeRarity(r.rarity),
            type: Array.isArray(r.type) ? r.type : r.type ? [r.type] : ['Chung'],
            descriptionRaw: r.descriptionRaw || '',
            translations: r.translations
          }))
        );

        if (!isMounted) return;
        setAllRelicsRaw(formatted);

        try {
          if (localStorage.getItem('poc-relic-tierlist-v3')) {
            localStorage.removeItem('poc-relic-tierlist-v3');
          }
        } catch {}

        const saved = localStorage.getItem(RELIC_STORAGE_KEY);
        let loadedFromStorage = false;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.tiers) && parsed.tiers.length > 0) {
              const hydrate = (items) =>
                (items || [])
                  .map((i) => formatted.find((f) => f.id === (typeof i === 'object' ? i.id : i)))
                  .filter(Boolean);
              const hydratedTiers = parsed.tiers.map((t) => ({ ...t, items: hydrate(t.items || []) }));
              const hydratedUnranked = hydrate(parsed.unranked || []);
              const totalRanked = hydratedTiers.reduce((acc, t) => acc + (t.items?.length || 0), 0);

              if (totalRanked >= 10) {
                setTiers(hydratedTiers);
                setUnranked(hydratedUnranked);
                loadedFromStorage = true;
              }
            }
          } catch (err) {
            console.warn('Failed to parse saved relic tierlist:', err);
          }
        }

        if (!loadedFromStorage) {
          const { sampleTiers, sampleUnranked } = getSampleData(formatted);
          setTiers(sampleTiers);
          setUnranked(sampleUnranked);
        }
      } catch (err) {
        console.error('Failed to load relics for tierlist:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();
    return () => {
      isMounted = false;
    };
  }, [getSampleData, sortItemsByName]);

  useEffect(() => {
    if (!loading && tiers.length > 0) {
      const totalItems = tiers.reduce((acc, t) => acc + (t.items?.length || 0), 0) + unranked.length;
      if (totalItems > 0) {
        localStorage.setItem(
          RELIC_STORAGE_KEY,
          JSON.stringify({ tiers, unranked })
        );
      }
    }
  }, [tiers, unranked, loading]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedRarities([]);
    setSelectedTypes([]);
    setSelectedIds([]);
  };

  const filterOptions = useMemo(
    () => ({
      rarities: [...new Set(allRelicsRaw.map((r) => r.rarity))]
        .filter(Boolean)
        .sort()
        .map((v) => ({ value: v, label: v })),
      types: [
        ...new Set(
          allRelicsRaw.flatMap((r) =>
            Array.isArray(r.type) ? r.type : r.type ? [r.type] : []
          )
        )
      ]
        .filter(Boolean)
        .sort()
        .map((v) => ({ value: v, label: v }))
    }),
    [allRelicsRaw]
  );

  const filteredUnranked = useMemo(() => {
    return unranked.filter((r) => {
      const rName = isEn ? r.translations?.en?.name || r.name : r.name;
      const matchesSearch =
        !searchTerm ||
        removeVietnameseTones(rName.toLowerCase()).includes(
          removeVietnameseTones(searchTerm.toLowerCase())
        );
      return (
        matchesSearch &&
        (selectedRarities.length === 0 || selectedRarities.includes(r.rarity)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.some((t) =>
            (Array.isArray(r.type) ? r.type : r.type ? [r.type] : []).includes(t)
          ))
      );
    });
  }, [unranked, searchTerm, selectedRarities, selectedTypes, isEn]);

  const handleResetToSample = () => {
    requestConfirm(
      t('tierList.confirmResetToSample') ||
        'Khôi phục danh sách mẫu? Mọi thay đổi hiện tại sẽ mất.',
      () => {
        const { sampleTiers, sampleUnranked } = getSampleData(allRelicsRaw);
        setTiers(sampleTiers);
        setUnranked(sampleUnranked);
        setSelectedIds([]);
      }
    );
  };

  const warehouseGroups = useMemo(
    () => ({
      'SỬ THI': filteredUnranked.filter((r) => r.rarity === 'SỬ THI'),
      HIẾM: filteredUnranked.filter((r) => r.rarity === 'HIẾM'),
      THƯỜNG: filteredUnranked.filter(
        (r) => r.rarity !== 'SỬ THI' && r.rarity !== 'HIẾM'
      )
    }),
    [filteredUnranked]
  );

  // Marquee mouse selection handlers
  const onMouseDown = (e) => {
    if (
      e.target.closest('button') ||
      e.target.tagName === 'INPUT' ||
      e.target.closest('[data-id]') ||
      e.target.closest('.color-picker') ||
      e.target.closest('[data-tier-handle]')
    )
      return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    boardRectRef.current = rect;
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    selectionDataRef.current = { startX, startY, currentX: startX, currentY: startY };
    setIsSelecting(true);
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedIds([]);
  };

  const onMouseMove = (e) => {
    if (!isSelecting) return;
    const rect = boardRectRef.current;
    if (!rect) return;
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    selectionDataRef.current.currentX = currentX;
    selectionDataRef.current.currentY = currentY;

    if (selectionBoxDivRef.current) {
      const { startX, startY } = selectionDataRef.current;
      selectionBoxDivRef.current.style.left = `${Math.min(startX, currentX)}px`;
      selectionBoxDivRef.current.style.top = `${Math.min(startY, currentY)}px`;
      selectionBoxDivRef.current.style.width = `${Math.abs(startX - currentX)}px`;
      selectionBoxDivRef.current.style.height = `${Math.abs(startY - currentY)}px`;
    }
  };

  const onMouseUp = (e) => {
    if (!isSelecting) return;
    const rect = boardRectRef.current;
    if (!rect || !boardRef.current) {
      setIsSelecting(false);
      return;
    }
    const { startX, startY, currentX, currentY } = selectionDataRef.current;
    const box = {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      right: Math.max(startX, currentX),
      bottom: Math.max(startY, currentY)
    };
    const temp = [];
    boardRef.current.querySelectorAll('[data-id]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (
        !(
          r.left - rect.left > box.right ||
          r.right - rect.left < box.left ||
          r.top - rect.top > box.bottom ||
          r.bottom - rect.top < box.top
        )
      ) {
        temp.push(el.getAttribute('data-id'));
      }
    });

    setSelectedIds((p) =>
      e.shiftKey || e.ctrlKey || e.metaKey
        ? [...new Set([...p, ...temp])]
        : [...new Set(temp)]
    );
    setIsSelecting(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (isSelecting) onMouseUp(e);
    };
    if (isSelecting) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting]);

  const findContainer = (id) => {
    if (
      id === 'unranked' ||
      id?.toString().startsWith('unranked') ||
      unranked.some((i) => i.id === id)
    )
      return 'unranked';
    const tier = tiers.find((t) => t.id === id || t.items.some((i) => i.id === id));
    return tier ? tier.id : null;
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || activeType === 'tier') return;

    const aId = active.id;
    const oId = over.id;

    const aCol = findContainer(aId);
    const oCol = findContainer(oId);

    if (!aCol || !oCol) return;

    if (aCol !== oCol) {
      const idsToMove = selectedIds.includes(aId) ? selectedIds : [aId];
      const moving = idsToMove
        .map((id) => {
          let found = unranked.find((r) => r.id === id);
          if (found) return found;
          for (const t of tiers) {
            found = t.items.find((r) => r.id === id);
            if (found) return found;
          }
          return allRelicsRaw.find((r) => r.id === id);
        })
        .filter(Boolean);

      setUnranked((prev) => {
        const filtered = prev.filter((i) => !idsToMove.includes(i.id));
        if (oCol === 'unranked') {
          const overIndex = filtered.findIndex((i) => i.id === oId);
          const insertIndex = overIndex >= 0 ? overIndex : filtered.length;
          const result = [...filtered];
          result.splice(insertIndex, 0, ...moving);
          return sortItemsByName(result);
        }
        return filtered;
      });

      setTiers((prev) =>
        prev.map((t) => {
          const filtered = t.items.filter((i) => !idsToMove.includes(i.id));
          if (t.id === oCol) {
            const overIndex = filtered.findIndex((i) => i.id === oId);
            const insertIndex = overIndex >= 0 ? overIndex : filtered.length;
            const result = [...filtered];
            result.splice(insertIndex, 0, ...moving);
            return { ...t, items: result };
          }
          return { ...t, items: filtered };
        })
      );
    } else if (aId !== oId) {
      if (aCol === 'unranked') {
        setUnranked((prev) => {
          const oldIndex = prev.findIndex((i) => i.id === aId);
          const newIndex = prev.findIndex((i) => i.id === oId);
          return arrayMove(prev, oldIndex, newIndex);
        });
      } else {
        setTiers((prev) =>
          prev.map((t) => {
            if (t.id === aCol) {
              const oldIndex = t.items.findIndex((i) => i.id === aId);
              const newIndex = t.items.findIndex((i) => i.id === oId);
              return { ...t, items: arrayMove(t.items, oldIndex, newIndex) };
            }
            return t;
          })
        );
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    if (activeType === 'tier') {
      if (active.id !== over.id) {
        setTiers(
          arrayMove(
            tiers,
            tiers.findIndex((t) => t.id === active.id),
            tiers.findIndex((t) => t.id === over.id)
          )
        );
      }
    }

    setActiveId(null);
    setActiveType(null);
    if (!selectedIds.includes(active.id)) setSelectedIds([]);
  };

  const downloadImage = async () => {
    setIsExporting(true);
    setShowColorPicker(null);
    const btn = document.getElementById('dl-relic-btn');
    const originalText = btn ? btn.innerText : '';
    if (btn) btn.innerText = t('tierList.processing') || 'Đang xử lý...';
    await new Promise((r) => setTimeout(r, 400));
    try {
      if (tierListRef.current) {
        const canvas = await html2canvas(tierListRef.current, {
          useCORS: true,
          backgroundColor: '#0c0f17',
          scale: 2
        });
        const link = document.createElement('a');
        link.download = `tierlist-relics-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
      if (btn) btn.innerText = originalText;
    }
  };

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    let found = unranked.find((r) => r.id === activeId);
    if (found) return found;
    for (const t of tiers) {
      found = t.items.find((r) => r.id === activeId);
      if (found) return found;
    }
    return allRelicsRaw.find((r) => r.id === activeId);
  }, [activeId, allRelicsRaw, unranked, tiers]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={(e) => {
        setActiveId(e.active.id);
        setActiveType(e.active.data.current?.type || 'item');
      }}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full pb-16 select-none">
        <div className="max-w-[1340px] w-full mx-auto px-1 sm:px-4 text-slate-200">
          {loading ? (
            <RelicTierSkeleton />
          ) : (
            <div>
              {/* Action Buttons Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono">
                    MATRIX BOARD
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-amber-400">
                    {tiers.reduce((acc, t) => acc + (t.items?.length || 0), 0)}/{allRelicsRaw.length} {isEn ? 'Ranked' : 'Đã xếp'}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      setTiers([
                        ...tiers,
                        {
                          id: `t-${Date.now()}`,
                          name: 'NEW',
                          description: isEn ? 'Custom Tier' : 'Bậc mới',
                          color: '#555555',
                          items: []
                        }
                      ])
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus size={14} className="text-sky-400" />
                    <span>{t('tierList.addRow') || 'Thêm hàng'}</span>
                  </button>

                  <button
                    id="dl-relic-btn"
                    type="button"
                    onClick={downloadImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{t('tierList.downloadImage') || 'Tải ảnh (PNG)'}</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetToSample}
                      className="p-2 rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                      title={t('tierList.confirmResetToSample') || 'Khôi phục danh sách mẫu'}
                    >
                      <Sparkles size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        requestConfirm(
                          t('tierList.confirmClearAll') ||
                            'Đưa tất cả cổ vật về kho?',
                          () => {
                            setTiers([
                              { id: 'tier-0', name: '0', description: '', color: '#ff3e3e', items: [] },
                              { id: 'tier-0-5', name: '0.5', description: '', color: '#ff7f7f', items: [] },
                              { id: 'tier-1', name: '1', description: '', color: '#ffbf7f', items: [] },
                              { id: 'tier-2', name: '2', description: '', color: '#ffff7f', items: [] },
                              { id: 'tier-3', name: '3', description: '', color: '#7fff7f', items: [] }
                            ]);
                            setUnranked(sortItemsByName([...allRelicsRaw]));
                          }
                        );
                      }}
                      className="p-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={t('tierList.confirmClearAll') || 'Xóa tất cả về kho'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tier Matrix Board */}
              <div
                ref={boardRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                className="relative min-h-[500px]"
              >
                {/* Selection Marquee Box */}
                <div
                  ref={selectionBoxDivRef}
                  className={`absolute border-2 border-sky-400 bg-sky-500/20 pointer-events-none z-[9999] rounded ${
                    isSelecting ? 'block' : 'hidden'
                  }`}
                />

                <div
                  ref={tierListRef}
                  className="bg-[#0b0f19] border border-white/10 rounded-xl flex flex-col gap-1 p-1 shadow-inner overflow-hidden"
                >
                  <SortableContext
                    items={tiers.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tiers.map((tier) => (
                      <SortableTierRow
                        key={tier.id}
                        tier={tier}
                        isExporting={isExporting}
                        setTiers={setTiers}
                        tiers={tiers}
                        showColorPicker={showColorPicker}
                        setShowColorPicker={setShowColorPicker}
                        setUnranked={setUnranked}
                        requestConfirm={requestConfirm}
                        isEn={isEn}
                      >
                        <SortableContext
                          items={tier.items.map((i) => i.id)}
                          strategy={rectSortingStrategy}
                        >
                          <DroppableZone
                            id={tier.id}
                            className="flex-1 p-1 sm:p-2 flex flex-wrap gap-1 sm:gap-2 items-center min-h-[58px]"
                          >
                            {tier.items.map((item) => {
                              const displayName = isEn
                                ? item.translations?.en?.name || item.name
                                : item.name;
                              return (
                                <div
                                  key={item.id}
                                  data-id={item.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                      setSelectedIds((prev) =>
                                        prev.includes(item.id)
                                          ? prev.filter((id) => id !== item.id)
                                          : [...prev, item.id]
                                      );
                                    } else {
                                      setSelectedIds([item.id]);
                                    }
                                  }}
                                  className={`rounded-md transition-all ${
                                    selectedIds.includes(item.id)
                                      ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 scale-90'
                                      : ''
                                  }`}
                                >
                                  <SortableItem
                                    id={item.id}
                                    avatar={item.avatar}
                                    title={displayName}
                                    isInTier={true}
                                  />
                                </div>
                              );
                            })}
                          </DroppableZone>
                        </SortableContext>
                      </SortableTierRow>
                    ))}
                  </SortableContext>
                </div>

                {/* Warehouse Section */}
                <div className="mt-6 p-3 sm:p-4 bg-[#0d121e] border border-white/10 rounded-xl shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {t('tierList.warehouseRelics') || 'Kho Cổ Vật'} ({filteredUnranked.length})
                    </h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIds(filteredUnranked.map((r) => r.id))
                        }
                        className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 flex-1 sm:flex-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckSquare size={14} />
                        <span>{isEn ? 'Select All' : 'Chọn tất cả'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        disabled={selectedIds.length === 0}
                        className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 flex-1 sm:flex-none flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Square size={14} />
                        <span>
                          {isEn ? 'Deselect' : 'Bỏ chọn'} ({selectedIds.length})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Inputs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 relative z-10">
                    <div className="relative col-span-2 sm:col-span-1">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={isEn ? 'Search relics...' : 'Tìm kiếm cổ vật...'}
                        className="w-full h-9 pl-8 pr-2 rounded-xl bg-[#090d16] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                      />
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>

                    <MultiSelectFilter
                      options={filterOptions.rarities}
                      selectedValues={selectedRarities}
                      onChange={setSelectedRarities}
                      placeholder={isEn ? 'Rarity' : 'Độ hiếm'}
                    />

                    <MultiSelectFilter
                      options={filterOptions.types}
                      selectedValues={selectedTypes}
                      onChange={setSelectedTypes}
                      placeholder={isEn ? 'Type' : 'Phân loại'}
                    />

                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="h-9 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw size={14} />
                      <span>{t('tierList.reset') || 'Đặt lại'}</span>
                    </button>
                  </div>

                  {/* Warehouse Droppable Zone Grouped by Rarity */}
                  <DroppableZone
                    id="unranked"
                    className="overflow-y-auto max-h-[560px] custom-scrollbar border-2 border-dashed border-white/10 rounded-xl p-3 bg-black/15 flex flex-col gap-4 content-start"
                  >
                    {Object.entries(warehouseGroups).map(([rarity, items]) =>
                      items.length > 0 ? (
                        <div key={rarity}>
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 opacity-70 tracking-wider">
                            {rarity} ({items.length})
                          </h3>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                data-id={item.id}
                                className={`rounded-md transition-all cursor-pointer ${
                                  selectedIds.includes(item.id)
                                    ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 scale-90'
                                    : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                    setSelectedIds((prev) =>
                                      prev.includes(item.id)
                                        ? prev.filter((id) => id !== item.id)
                                        : [...prev, item.id]
                                    );
                                  } else {
                                    setSelectedIds([item.id]);
                                  }
                                }}
                              >
                                <SortableItem
                                  id={item.id}
                                  avatar={item.avatar}
                                  title={
                                    isEn
                                      ? item.translations?.en?.name || item.name
                                      : item.name
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </DroppableZone>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      {activeId &&
        createPortal(
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.4' } }
              })
            }}
            zIndex={10000}
          >
            {activeType === 'tier' ? (
              <div className="flex min-h-[60px] sm:min-h-[100px] w-[300px] sm:w-[600px] bg-[#0b0f19] border-2 border-sky-400 rounded-lg overflow-hidden shadow-2xl opacity-90">
                <div className="w-6 sm:w-8 shrink-0 bg-black/30" />
                <div
                  style={{
                    backgroundColor: tiers.find((t) => t.id === activeId)?.color
                  }}
                  className="w-14 sm:w-36 flex items-center justify-center font-black text-sm sm:text-3xl text-black uppercase shrink-0"
                >
                  {tiers.find((t) => t.id === activeId)?.name}
                </div>
                <div className="flex-1 p-4 bg-black/50 text-slate-300 italic flex items-center text-xs sm:text-sm">
                  {t('tierList.movingRow') || 'Di chuyển hàng...'}
                </div>
              </div>
            ) : (
              <div className="relative">
                <SortableItem
                  id={activeId}
                  avatar={activeItem?.avatar}
                  isOverlay
                />
                {selectedIds.length > 1 && selectedIds.includes(activeId) && (
                  <div className="absolute -top-2 -right-2 bg-sky-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    {selectedIds.length}
                  </div>
                )}
              </div>
            )}
          </DragOverlay>,
          document.body
        )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() =>
          setConfirmConfig({ isOpen: false, message: '', onConfirm: null })
        }
        title={isEn ? 'Confirmation' : 'Xác nhận'}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        confirmText={isEn ? 'Confirm' : 'Đồng ý'}
        cancelText={isEn ? 'Cancel' : 'Hủy'}
      />
    </DndContext>
  );
}
