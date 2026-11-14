import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import nodeTypesData from '../data/nodeTypes.json';
import { useLanguage } from '../context/LanguageContext';

const getNodeIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('start')) {
    return (
      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (t.includes('mini')) {
    return (
      <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="9" cy="12" r="1" />
        <circle cx="15" cy="12" r="1" />
        <path d="M8 20v2h8v-2" />
        <path d="m12.5 17-.5-1-.5 1h1z" />
        <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
      </svg>
    );
  }
  if (t.includes('boss')) {
    return (
      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="9" cy="12" r="1" />
        <circle cx="15" cy="12" r="1" />
        <path d="M8 20v2h8v-2" />
        <path d="m12.5 17-.5-1-.5 1h1z" />
        <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
      </svg>
    );
  }
  if (t.includes('power')) {
    return (
      <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (t.includes('heal')) {
    return (
      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }
  if (t.includes('encounter')) {
    return (
      <svg className="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (t.includes('shop')) {
    return (
      <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  if (t.includes('champion')) {
    return (
      <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M6 3h12l4 6-10 12L2 9z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
};

const getNodeBgColor = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('start')) return 'bg-emerald-950 border-emerald-400';
  if (t.includes('boss') || t.includes('mini')) return 'bg-red-950 border-red-500';
  if (t.includes('heal')) return 'bg-green-950 border-green-400';
  if (t.includes('shop') || t.includes('power')) return 'bg-amber-950 border-amber-400';
  if (t.includes('champion')) return 'bg-cyan-950 border-cyan-400';
  if (t.includes('encounter')) return 'bg-sky-950 border-sky-400';
  return 'bg-slate-900 border-white/20';
};

const AdventureLine = ({ x1, y1, x2, y2, zoom, mapSize }) => {
  if (!mapSize.width || !mapSize.height) return null;

  const dx = (x2 - x1) * mapSize.width;
  const dy = (y2 - y1) * mapSize.height;
  const angle = Math.atan2(dy, dx);

  const inverseScale = 1 / Math.pow(zoom, 0.75);
  const baseOffsetPx = 20;
  const offsetPx = baseOffsetPx * inverseScale;

  const offsetX_pct = ((offsetPx * Math.cos(angle)) / mapSize.width) * 100;
  const offsetY_pct = ((offsetPx * Math.sin(angle)) / mapSize.height) * 100;

  const startX_pct = x1 + offsetX_pct;
  const startY_pct = y1 + offsetY_pct;
  const finalX2_pct = x2 - offsetX_pct;
  const finalY2_pct = y2 - offsetY_pct;

  return (
    <line
      x1={`${startX_pct}%`}
      y1={`${startY_pct}%`}
      x2={`${finalX2_pct}%`}
      y2={`${finalY2_pct}%`}
      stroke="rgba(245, 158, 11, 0.75)"
      strokeWidth={2}
      strokeDasharray="5,4"
      markerEnd="url(#arrowhead)"
    />
  );
};

const AdventureNode = ({
  node,
  zoom,
  isDragging,
  resolvedBosses,
  active,
  onShowTooltip
}) => {
  const nodeRef = useRef(null);

  const leftPos = typeof node.position?.x === 'number' ? `${node.position.x}%` : node.position?.x || '0%';
  const topPos = typeof node.position?.y === 'number' ? `${node.position.y}%` : node.position?.y || '0%';
  const inverseScale = 1 / Math.pow(zoom, 0.75);

  const handleInteraction = (e) => {
    if (e) e.stopPropagation();
    if (nodeRef.current && !isDragging) {
      const rect = nodeRef.current.getBoundingClientRect();
      onShowTooltip(node, { x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  };

  const handleMouseLeave = () => {
    if (active) onShowTooltip(null, null);
  };

  let bossImage = null;
  if (Array.isArray(node.bosses) && node.bosses.length === 1) {
    const singleBossId = node.bosses[0];
    const bossData = resolvedBosses?.find((b) => b.bossID === singleBossId);
    if (bossData) {
      bossImage = bossData.background || bossData.avatar;
    }
  }

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none ${active ? 'z-50' : ''}`}
      style={{ left: leftPos, top: topPos }}
    >
      <div
        ref={nodeRef}
        className="pointer-events-auto cursor-pointer"
        style={{
          transform: `scale(${inverseScale})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          transformOrigin: 'center center'
        }}
        onMouseEnter={handleInteraction}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleInteraction}
        onTouchEnd={handleMouseLeave}
        onClick={handleInteraction}
      >
        <div className={`relative flex items-center justify-center transition-transform duration-200 ${active ? 'scale-125' : 'hover:scale-110'}`}>
          <div
            className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 overflow-hidden shadow-lg ${getNodeBgColor(
              node.nodeType
            )}`}
          >
            {bossImage ? (
              <img
                src={bossImage}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              getNodeIcon(node.nodeType)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdventureMapVisualizer({ nodes = [], background = '', resolvedBosses = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const mapRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipCoords, setTooltipCoords] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('16/9');
  const [mapSize, setMapSize] = useState({ width: 1000, height: 400 });

  // ResizeObserver to update width/height for connector lines
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMapSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // Wheel zoom handler
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.002;
      const delta = -e.deltaY * zoomSensitivity;
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
      setHoveredNode(null);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setHoveredNode(null);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUpOrLeave = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!nodes || nodes.length === 0) return null;

  return (
    <div
      ref={mapRef}
      className={`relative w-full bg-[#070a10] border border-white/10 rounded-2xl overflow-hidden shadow-2xl select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ aspectRatio }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
    >
      {/* Zoom / Pan Action Controls */}
      <div
        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30 flex flex-col gap-1 bg-[#090d16]/90 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 0.4, 3))}
          title={isEn ? 'Zoom in' : 'Phóng to'}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleReset}
          title={isEn ? 'Reset view' : 'Đặt lại'}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 0.4, 0.5))}
          title={isEn ? 'Zoom out' : 'Thu nhỏ'}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      {/* Map Canvas with Pan & Zoom */}
      <div
        className={`w-full h-full origin-center ${!isDragging ? 'transition-transform duration-200 ease-out' : ''}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* Background Artwork */}
        {background && (
          <img
            src={background}
            alt=""
            onLoad={(e) => {
              const { naturalWidth, naturalHeight } = e.target;
              if (naturalWidth && naturalHeight) {
                setAspectRatio(`${naturalWidth}/${naturalHeight}`);
              }
            }}
            className="absolute inset-0 w-full h-full object-fill opacity-25 pointer-events-none"
            draggable={false}
          />
        )}

        {/* SVG Connector Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="rgba(245, 158, 11, 0.75)" />
            </marker>
          </defs>
          {nodes.map((node) =>
            (node.nextNodes || []).map((targetID) => {
              const targetNode = nodes.find((n) => n.nodeID === targetID);
              if (!targetNode) return null;
              return (
                <AdventureLine
                  key={`${node.nodeID}-${targetID}`}
                  x1={node.position?.x}
                  y1={node.position?.y}
                  x2={targetNode.position?.x}
                  y2={targetNode.position?.y}
                  zoom={zoom}
                  mapSize={mapSize}
                />
              );
            })
          )}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node, index) => (
          <AdventureNode
            key={node.nodeID || index}
            node={node}
            zoom={zoom}
            isDragging={isDragging}
            resolvedBosses={resolvedBosses}
            active={hoveredNode?.nodeID === node.nodeID}
            onShowTooltip={(n, c) => {
              setHoveredNode(n);
              setTooltipCoords(c);
            }}
          />
        ))}
      </div>

      {/* Portal Tooltip */}
      {hoveredNode &&
        tooltipCoords &&
        !isDragging &&
        createPortal(
          (() => {
            const nodeMeta = nodeTypesData.find((t) => t.nodeType === hoveredNode.nodeType) || {};
            const nodeDesc = isEn
              ? nodeMeta.translations?.en?.description || nodeMeta.description
              : nodeMeta.description || nodeMeta.translations?.en?.description || '';

            return (
              <div
                className="fixed bg-[#090d16]/95 backdrop-blur-md border border-[#8CC0EB] rounded-xl shadow-2xl p-2.5 z-[9999] pointer-events-none max-w-xs text-xs"
                style={{
                  left: `${tooltipCoords.x}px`,
                  top: `${tooltipCoords.y}px`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="flex items-center justify-between gap-2 font-bold uppercase text-[#8CC0EB] mb-1">
                  <span>{hoveredNode.nodeType}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-slate-300">
                    {hoveredNode.nodeID}
                  </span>
                </div>
                {nodeDesc && <p className="text-slate-300 leading-snug mb-1.5 italic text-[11px]">{nodeDesc}</p>}
                {Array.isArray(hoveredNode.bosses) && hoveredNode.bosses.length > 0 && (
                  <div className="pt-1 border-t border-white/10 text-[11px]">
                    <span className="font-bold text-amber-300 mr-1">{isEn ? 'Bosses:' : 'Kẻ địch:'}</span>
                    <span className="text-white">
                      {hoveredNode.bosses
                        .map((bId) => {
                          const found = resolvedBosses.find((rb) => rb.bossID === bId);
                          return (isEn ? found?.translations?.en?.bossName : found?.bossName) || found?.bossName || bId;
                        })
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })(),
          document.body
        )}
    </div>
  );
}
