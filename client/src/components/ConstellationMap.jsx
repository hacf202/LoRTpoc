import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import LorMarkup from './LorMarkup';
import { useLanguage } from '../context/LanguageContext';
import { handleImageError } from '../utils/imageFallback';

function getRequirementLabel(type, isEn) {
  switch (type) {
    case 'Fragment':
      return isEn ? 'Fragment' : 'Mảnh tướng';
    case 'Gemstone':
      return isEn ? 'Gemstone' : 'Ngọc bổ trợ';
    case 'Star Crystal':
      return isEn ? 'Star Crystal' : 'Tinh thể sao';
    case 'Nova Crystal':
      return isEn ? 'Nova Crystal' : 'Tinh thể siêu tân tinh';
    case 'Stardust':
      return isEn ? 'Stardust' : 'Bụi tinh tú';
    default:
      return type || '';
  }
}

function getNodeCoordinates(node) {
  const x = node.position?.x ?? node.pos?.x ?? 50;
  const y = node.position?.y ?? node.pos?.y ?? 50;
  return { x: Number(x), y: Number(y) };
}

function ConstellationNode({
  node,
  index,
  active,
  zoom,
  isDragging,
  onShowTooltip,
  isEn,
  onSelectPower
}) {
  const nodeRef = useRef(null);
  const { x, y } = getNodeCoordinates(node);
  const isStarPower = node.nodeType === 'starPower';
  const isGem = node.nodeType === 'bonusStarGem';

  const starIndex = node.nodeID === 'n1' ? 1
    : node.nodeID === 'n2' ? 2
    : node.nodeID === 'n3' ? 3
    : node.nodeID === 'n4' ? 4
    : node.nodeID === 'n5' ? 5
    : node.nodeID === 'n6' ? 6
    : (isStarPower ? index + 1 : null);

  const fallbackIcon = isStarPower
    ? (node.powerCode ? `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${node.powerCode}.png` : 'https://images.lortpoc.com/icon/starIcon.webp')
    : isGem
    ? 'https://images.lortpoc.com/icon/gemIcon.webp'
    : 'https://images.lortpoc.com/icon/starIcon.webp';

  const nodeImage = node.image || fallbackIcon;
  const inverseScale = 1 / Math.pow(Math.max(zoom, 0.4), 0.75);

  const handleInteraction = (e) => {
    if (e) e.stopPropagation();
    if (nodeRef.current && !isDragging) {
      const rect = nodeRef.current.getBoundingClientRect();
      onShowTooltip(node, { x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  };

  const handleMouseLeave = () => {
    if (active) {
      onShowTooltip(null, null);
    }
  };

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${active ? 'z-40' : 'z-10'}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        ref={nodeRef}
        className="pointer-events-auto cursor-pointer"
        style={{
          transform: `scale(${inverseScale})`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          transformOrigin: 'center center'
        }}
        onMouseEnter={handleInteraction}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          handleInteraction(e);
          if (node.powerCode && !isDragging) {
            onSelectPower?.(node.powerCode);
          }
        }}
      >
        <div
          className={`relative flex items-center justify-center transition-all duration-200 ${
            active ? 'scale-125' : 'hover:scale-110'
          }`}
        >
          {/* Active / Recommended Glow */}
          {(node.isRecommended || active) && (
            <div
              className={`absolute inset-0 rounded-full blur-md opacity-80 ${
                isStarPower
                  ? 'bg-amber-400'
                  : isGem
                  ? 'bg-purple-500'
                  : 'bg-[#8CC0EB]'
              }`}
            />
          )}

          {/* Node Frame */}
          <div
            className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-full p-1 flex items-center justify-center bg-[#070a10] border-2 transition-colors shadow-lg overflow-visible ${
              active
                ? 'border-white'
                : node.isRecommended
                ? 'border-amber-400'
                : isStarPower
                ? 'border-amber-500/70'
                : isGem
                ? 'border-purple-500/70'
                : 'border-sky-500/70'
            }`}
          >
            <img
              src={nodeImage}
              alt={node.name || node.nodeID}
              className="w-full h-full object-contain pointer-events-none"
              onError={(e) => handleImageError(e, 'power', fallbackIcon)}
            />

            {/* Star badge indicator */}
            {isStarPower && starIndex && (
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-black bg-amber-400 text-black border border-black shadow">
                {starIndex}★
              </span>
            )}
            {!isStarPower && (
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-mono font-bold bg-[#141b2a] text-slate-200 border border-white/20">
                {node.nodeID.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConstellationLine({ fromNode, toNode, isRecommended, zoom }) {
  const p1 = getNodeCoordinates(fromNode);
  const p2 = getNodeCoordinates(toNode);

  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const baseOffset = isMobile ? 2.5 : 3.8;
  const offset = baseOffset / Math.pow(Math.max(zoom, 0.4), 0.75);

  const finalX2 = p2.x - offset * Math.cos(angle);
  const finalY2 = p2.y - offset * Math.sin(angle);

  const strokeWidth = isMobile
    ? (isRecommended ? 1.6 : 1)
    : (isRecommended ? 2.4 : 1.4);

  return (
    <line
      x1={`${p1.x}%`}
      y1={`${p1.y}%`}
      x2={`${finalX2}%`}
      y2={`${finalY2}%`}
      stroke={isRecommended ? '#f59e0b' : 'rgba(140, 192, 235, 0.35)'}
      strokeWidth={strokeWidth}
      strokeDasharray={isRecommended ? '0' : '6,4'}
      markerEnd={`url(#${isRecommended ? 'arrowhead-rec' : 'arrowhead'})`}
      className={isRecommended ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]' : ''}
    />
  );
}

export default function ConstellationMap({ constellation, championName = '', onSelectPower }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipCoords, setTooltipCoords] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragTimeout = useRef(null);

  const nodes = constellation?.nodes || [];

  const handlePointerDown = (clientX, clientY) => {
    setIsPointerDown(true);
    setIsDragging(false);
    setDragStart({ x: clientX - panRef.current.x, y: clientY - panRef.current.y });
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!isPointerDown) return;
    setIsDragging(true);

    const newPanX = clientX - dragStart.x;
    const newPanY = clientY - dragStart.y;

    if (containerRef.current) {
      containerRef.current.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${zoom})`;
    }

    panRef.current = { x: newPanX, y: newPanY };
    setHoveredNode(null);
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
    if (dragTimeout.current) clearTimeout(dragTimeout.current);
    dragTimeout.current = setTimeout(() => setIsDragging(false), 50);
    setPan({ x: panRef.current.x, y: panRef.current.y });
  };

  const handleMouseDown = (e) => handlePointerDown(e.clientX, e.clientY);
  const handleMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
  const handleMouseUp = () => handlePointerUp();

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchEnd = () => handlePointerUp();

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.6));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    if (containerRef.current) {
      containerRef.current.style.transform = 'translate(0px, 0px) scale(1)';
    }
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-2 sm:p-8 text-center text-xs text-slate-400 bg-[#080c14] rounded-xl border border-white/10">
        {isEn ? 'No constellation map data.' : 'Chưa có dữ liệu bản đồ chòm sao.'}
      </div>
    );
  }

  // Tooltip positioning
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const isMobile = screenW < 640;
  let tooltipStyle = {};
  let arrowStyle = {};

  if (tooltipCoords) {
    if (isMobile) {
      const margin = 12;
      const width = screenW - margin * 2;
      const arrowX = Math.max(margin + 10, Math.min(tooltipCoords.x - margin, width - 10));
      tooltipStyle = {
        left: `${margin}px`,
        top: `${tooltipCoords.y}px`,
        transform: 'translate(0, -100%)',
        width: `${width}px`
      };
      arrowStyle = { left: `${arrowX}px`, transform: 'translateX(-50%)' };
    } else {
      const isNearRight = tooltipCoords.x > screenW - 180;
      const isNearLeft = tooltipCoords.x < 180;
      const transformX = isNearRight ? 'calc(-100% + 24px)' : isNearLeft ? '-24px' : '-50%';
      const arrowLeft = isNearRight ? 'calc(100% - 24px)' : isNearLeft ? '24px' : '50%';

      tooltipStyle = {
        left: `${tooltipCoords.x}px`,
        top: `${tooltipCoords.y}px`,
        transform: `translate(${transformX}, -100%)`,
        width: 'max-content',
        maxWidth: '340px'
      };
      arrowStyle = { left: arrowLeft, transform: 'translateX(-50%)' };
    }
  }

  const hoveredName = hoveredNode
    ? ((isEn ? hoveredNode.translations?.en?.name : hoveredNode.name) || hoveredNode.name || hoveredNode.nodeID)
    : '';

  const hoveredDesc = hoveredNode
    ? ((isEn
        ? (hoveredNode.translations?.en?.description || hoveredNode.translations?.en?.descriptionRaw)
        : (hoveredNode.description || hoveredNode.descriptionRaw)) || '')
    : '';

  const hoveredRarity = hoveredNode
    ? ((isEn ? hoveredNode.translations?.en?.rarity : hoveredNode.rarity) || hoveredNode.rarity)
    : null;

  return (
    <div
      className={`relative w-full aspect-video min-h-[300px] sm:min-h-[460px] bg-[#05080e] border sm:border-2 border-white/15 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setHoveredNode(null)}
    >
      {/* Zoom / Pan Controls (Clean SVG icons without emojis) */}
      <div
        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30 flex items-center gap-1 sm:gap-1.5 bg-[#0c101c]/90 backdrop-blur-md p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-white/15 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          title={isEn ? 'Zoom in' : 'Phóng to'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white bg-[#141b2a] hover:bg-[#8CC0EB] hover:text-[#07090e] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleReset}
          title={isEn ? 'Reset view' : 'Khôi phục góc nhìn'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white bg-[#141b2a] hover:bg-[#8CC0EB] hover:text-[#07090e] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title={isEn ? 'Zoom out' : 'Thu nhỏ'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white bg-[#141b2a] hover:bg-[#8CC0EB] hover:text-[#07090e] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      {/* Main Pan/Zoom Interactive Container */}
      <div
        ref={containerRef}
        className={`w-full h-full origin-center relative ${!isDragging ? 'transition-transform duration-200 ease-out' : ''}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* Background Image */}
        {constellation?.backgroundImage && (
          <img
            src={constellation.backgroundImage}
            alt="Constellation Map"
            className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
            draggable="false"
          />
        )}

        {/* Dark blurred overlay for prominent node contrast */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] pointer-events-none" />

        {/* SVG Path Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth={isMobile ? '5' : '7'}
              markerHeight={isMobile ? '4' : '6'}
              refX={isMobile ? '4.5' : '6.5'}
              refY={isMobile ? '2' : '3'}
              orient="auto"
            >
              <path
                d={isMobile ? 'M0,0 L5,2 L0,4 L1.5,2 Z' : 'M0,0 L7,3 L0,6 L2,3 Z'}
                fill="rgba(140, 192, 235, 0.7)"
              />
            </marker>
            <marker
              id="arrowhead-rec"
              markerWidth={isMobile ? '5' : '7'}
              markerHeight={isMobile ? '4' : '6'}
              refX={isMobile ? '4.5' : '6.5'}
              refY={isMobile ? '2' : '3'}
              orient="auto"
            >
              <path
                d={isMobile ? 'M0,0 L5,2 L0,4 L1.5,2 Z' : 'M0,0 L7,3 L0,6 L2,3 Z'}
                fill="#f59e0b"
              />
            </marker>
          </defs>

          {nodes.map((node) => {
            const nextList = Array.isArray(node.nextNodes) ? node.nextNodes : [];
            return nextList.map((targetID) => {
              const target = nodes.find((n) => n.nodeID === targetID);
              if (!target) return null;
              return (
                <ConstellationLine
                  key={`${node.nodeID}-${targetID}`}
                  fromNode={node}
                  toNode={target}
                  isRecommended={Boolean(node.isRecommended && target.isRecommended)}
                  zoom={zoom}
                />
              );
            });
          })}
        </svg>

        {/* Node Elements */}
        {nodes.map((node, index) => (
          <ConstellationNode
            key={node.nodeID || index}
            node={node}
            index={index}
            active={hoveredNode?.nodeID === node.nodeID}
            zoom={zoom}
            isDragging={isDragging}
            onShowTooltip={(n, coords) => {
              setHoveredNode(n);
              setTooltipCoords(coords);
            }}
            isEn={isEn}
            onSelectPower={onSelectPower}
          />
        ))}
      </div>

      {/* Floating Interactive Tooltip via Portal */}
      {hoveredNode &&
        tooltipCoords &&
        !isDragging &&
        createPortal(
          <div
            className="fixed bg-[#090d16]/95 border sm:border-2 border-[#8CC0EB] rounded-xl shadow-2xl p-2 sm:p-3.5 z-[9999] pointer-events-none backdrop-blur-md space-y-1.5 sm:space-y-2"
            style={tooltipStyle}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 border-b border-white/10 pb-1 sm:pb-1.5">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#141b2a] text-[#8CC0EB] border border-[#8CC0EB]/40">
                  {hoveredNode.nodeID.toUpperCase()}
                </span>
                <h4 className="text-xs sm:text-sm font-bold font-heading text-[#FFF9D2] truncate">
                  {hoveredName}
                </h4>
              </div>

              {hoveredRarity && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-sky-950 text-sky-200 border border-sky-500/30">
                  {hoveredRarity}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="text-xs text-slate-200 leading-relaxed font-sans">
              {hoveredDesc ? (
                <LorMarkup text={hoveredDesc} />
              ) : (
                <span className="italic text-slate-500">{isEn ? 'No details' : 'Chưa có diễn giải'}</span>
              )}
            </div>

            {/* Requirements */}
            {hoveredNode.requirements && hoveredNode.requirements.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 pt-1 sm:pt-1.5 border-t border-white/10 text-[10px] sm:text-[11px] text-slate-300 flex-wrap">
                <span className="text-slate-400">{isEn ? 'Cost:' : 'Yêu cầu:'}</span>
                {hoveredNode.requirements.map((req, rIdx) => (
                  <span
                    key={rIdx}
                    className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#141b2a] text-[#FFEBCC] border border-amber-500/30"
                  >
                    {req.value} {getRequirementLabel(req.type, isEn)}
                  </span>
                ))}
              </div>
            )}

            {/* Arrow Pointer */}
            <div
              className="absolute top-full border-6 border-transparent border-t-[#8CC0EB]"
              style={arrowStyle}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
