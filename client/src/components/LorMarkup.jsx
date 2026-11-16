import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { tokenizeLorText, formatKeywordEn } from '../utils/lorMarkupParser';
import { getEntityPreview, getCachedEntityPreview } from '../utils/entityPreviewService';
import LorMarkupPreviewTooltip from './LorMarkupPreviewTooltip';
import { toChampionSlug } from '../utils/slug';

/**
 * Tag styling map based on tag prefix
 */
const TAG_STYLES = {
  // Keyword / Rule trigger
  k: {
    color: 'text-amber-300 decoration-amber-400/80',
    icon: '⚡'
  },
  // Card reference
  cd: {
    color: 'text-sky-300 decoration-sky-400/80',
    icon: '🃏'
  },
  // Champion reference
  c: {
    color: 'text-indigo-300 decoration-indigo-400/80',
    icon: '⚔️'
  },
  // Relic reference
  r: {
    color: 'text-cyan-300 decoration-cyan-400/80',
    icon: '💎'
  },
  // Power reference
  p: {
    color: 'text-orange-300 decoration-orange-400/80',
    icon: '🔮'
  },
  // Item reference
  i: {
    color: 'text-teal-300 decoration-teal-400/80',
    icon: '🛡️'
  },
  // Map / Adventure reference
  m: {
    color: 'text-emerald-300 decoration-emerald-400/80',
    icon: '🗺️'
  }
};

const NAVIGABLE_TAGS = ['cd', 'p', 'r', 'i', 'c', 'm'];

/**
 * Tag con riêng biệt hỗ trợ tự động hiển thị tên theo ngôn ngữ đang chọn
 */
function LorTagItem({
  token,
  index,
  style,
  isClickable,
  onTagClick,
  onMouseEnter,
  onMouseLeave
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const tagType = (token.tagType || '').toLowerCase();

  const [entityData, setEntityData] = useState(() => getCachedEntityPreview(tagType, token.id));

  useEffect(() => {
    if (tagType === 'k') return;
    const cached = getCachedEntityPreview(tagType, token.id);
    if (cached) {
      setEntityData(cached);
      return;
    }

    let isMounted = true;
    getEntityPreview(tagType, token.id, token.label).then((res) => {
      if (isMounted && res) {
        setEntityData(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tagType, token.id, token.label]);

  let displayLabel = token.label;
  if (tagType === 'k') {
    displayLabel = isEn ? formatKeywordEn(token.id) : (token.label || token.id);
  } else if (isEn) {
    displayLabel = entityData?.nameEn || entityData?.name || token.label;
  } else {
    displayLabel = entityData?.name || token.label;
  }

  return (
    <span
      key={`tag-${index}`}
      onClick={(e) => isClickable && onTagClick(e, token)}
      onMouseEnter={(e) => onMouseEnter(e, token)}
      onMouseLeave={onMouseLeave}
      className={`font-bold underline underline-offset-2 transition-all inline-block select-text ${style.color} ${
        isClickable ? 'cursor-pointer hover:opacity-80 active:scale-[0.98]' : ''
      }`}
    >
      {displayLabel}
    </span>
  );
}

/**
 * High-performance LoR Rich Markup Text Component
 * Transforms raw LoR tags [k:...], [cd:...], [p:...], [r:...], stats, and markdown into interactive UI elements
 * Features:
 * - Điều hướng tự động dựa trên từ khóa: cd -> card, p -> power, r -> relic, i -> item, c -> champion, m -> map
 * - Hover hiển thị Tooltip xem trước hình ảnh/icon và thông số tóm tắt
 * - Hiển thị đúng tên đối tượng theo ngôn ngữ hiện tại (VI/EN)
 */
export default function LorMarkup({
  text = '',
  className = '',
  inline = false,
  onTagClick,
  disableHover = false,
  disableNavigation = false
}) {
  const [hoveredState, setHoveredState] = useState(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback((e, token) => {
    if (disableHover) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const el = e.currentTarget;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const tooltipWidth = 250;
      const tooltipHeight = 85;
      const spaceAbove = rect.top;
      const placeAbove = spaceAbove >= tooltipHeight + 12;

      const top = placeAbove
        ? Math.max(8, rect.top - tooltipHeight - 6)
        : Math.min(window.innerHeight - tooltipHeight - 8, rect.bottom + 6);

      const left = Math.max(
        8,
        Math.min(window.innerWidth - tooltipWidth - 8, rect.left + rect.width / 2 - tooltipWidth / 2)
      );

      setHoveredState({
        token,
        position: { top, left }
      });
    }, 100);
  }, [disableHover]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredState(null);
  }, []);

  const handleTagClick = useCallback((e, token) => {
    if (disableNavigation) return;
    e.stopPropagation();

    // 1. Nếu component cha có truyền onTagClick tùy biến, gọi trước
    if (onTagClick) {
      const handled = onTagClick(token);
      if (handled !== false) {
        setHoveredState(null);
        return;
      }
    }

    const tagType = (token.tagType || '').toLowerCase();
    const id = encodeURIComponent(token.id);
    let targetPath = null;

    if (tagType === 'cd') {
      targetPath = `/card/${id}`;
    } else if (tagType === 'p') {
      targetPath = `/power/${id}`;
    } else if (tagType === 'r') {
      targetPath = `/relic/${id}`;
    } else if (tagType === 'i') {
      targetPath = `/item/${id}`;
    } else if (tagType === 'c') {
      targetPath = `/champion/${toChampionSlug(id)}#relics`;
    } else if (tagType === 'm') {
      targetPath = `/map/${id}`;
    }

    if (!targetPath) return;

    // Đóng hover tooltip ngay lập tức khi click
    setHoveredState(null);

    // 2. Nếu đang ở màn hình Quản trị Admin, mở tab mới để tránh làm mất bản nháp form đang soạn
    const isAdminView = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (isAdminView) {
      window.open(targetPath, '_blank');
      return;
    }

    // 3. Ở các màn hình cẩm nang người dùng, điều hướng mượt mà không reload trang
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [disableNavigation, onTagClick]);

  if (!text) return null;

  const tokens = tokenizeLorText(text);

  const content = tokens.map((token, index) => {
    switch (token.type) {
      case 'tag': {
        const tagType = (token.tagType || '').toLowerCase();
        const style = TAG_STYLES[tagType] || TAG_STYLES.k;
        const isNavigable = NAVIGABLE_TAGS.includes(tagType);
        const isClickable = !disableNavigation && Boolean(onTagClick || isNavigable);

        return (
          <LorTagItem
            key={`tag-${index}`}
            token={token}
            index={index}
            style={style}
            isClickable={isClickable}
            onTagClick={handleTagClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        );
      }

      case 'stat':
        return (
          <span
            key={`stat-${index}`}
            className="font-mono font-bold text-amber-300 mx-0.5"
          >
            {token.value}
          </span>
        );

      case 'bullet':
        return (
          <span
            key={`bullet-${index}`}
            className="text-[#8CC0EB] font-bold mr-1.5 select-none"
          >
            ◆
          </span>
        );

      case 'newline':
        return <br key={`br-${index}`} />;

      case 'text':
      default:
        return <span key={`txt-${index}`}>{token.value}</span>;
    }
  });

  return (
    <>
      {inline ? (
        <span className={className}>{content}</span>
      ) : (
        <div className={`leading-relaxed ${className}`}>{content}</div>
      )}

      {hoveredState && (
        <LorMarkupPreviewTooltip
          token={hoveredState.token}
          position={hoveredState.position}
        />
      )}
    </>
  );
}
