import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Cấu trúc 15 Nodes chuẩn cho tướng 6 sao (Không nối dây, sắp xếp ngay ngắn theo 3 hàng)
export const STANDARD_CONSTELLATION_NODES = [
  // Hàng 1 (Y: 22%): 6 Node starPower (Sức mạnh 1 đến 6 sao)
  {
    nodeID: 'n1',
    nodeType: 'starPower',
    name: 'Sức Mạnh 1 Sao',
    position: { x: 16.0, y: 22.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 10 }],
    isRecommended: true
  },
  {
    nodeID: 'n2',
    nodeType: 'starPower',
    name: 'Sức Mạnh 2 Sao',
    position: { x: 29.5, y: 22.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 20 }],
    isRecommended: true
  },
  {
    nodeID: 'n3',
    nodeType: 'starPower',
    name: 'Sức Mạnh 3 Sao',
    position: { x: 43.0, y: 22.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 40 }],
    isRecommended: true
  },
  {
    nodeID: 'n4',
    nodeType: 'starPower',
    name: 'Sức Mạnh 4 Sao',
    position: { x: 56.5, y: 22.0 },
    nextNodes: [],
    requirements: [
      { type: 'Fragment', value: 60 },
      { type: 'Crystal', value: 10 }
    ],
    isRecommended: true
  },
  {
    nodeID: 'n5',
    nodeType: 'starPower',
    name: 'Sức Mạnh 5 Sao',
    position: { x: 70.0, y: 22.0 },
    nextNodes: [],
    requirements: [
      { type: 'Fragment', value: 80 },
      { type: 'Crystal', value: 40 }
    ],
    isRecommended: true
  },
  {
    nodeID: 'n6',
    nodeType: 'starPower',
    name: 'Sức Mạnh 6 Sao',
    position: { x: 83.5, y: 22.0 },
    nextNodes: [],
    requirements: [
      { type: 'Fragment', value: 100 },
      { type: 'Nova Crystal', value: 1 }
    ],
    isRecommended: true
  },

  // Hàng 2 (Y: 52%): 5 Node bonusStar (Ngôi sao hỗ trợ & chỉ số)
  {
    nodeID: 'n7',
    nodeType: 'bonusStar',
    name: 'Ngôi Sao Tiền Thưởng',
    position: { x: 20.0, y: 52.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 40 }],
    isRecommended: false
  },
  {
    nodeID: 'n8',
    nodeType: 'bonusStar',
    name: 'Ngôi Sao Huyền Thoại',
    position: { x: 35.0, y: 52.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 40 }],
    isRecommended: false
  },
  {
    nodeID: 'n9',
    nodeType: 'bonusStar',
    name: 'Ngôi Sao Chúc Phúc',
    position: { x: 50.0, y: 52.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 40 }],
    isRecommended: false
  },
  {
    nodeID: 'n10',
    nodeType: 'bonusStar',
    name: 'Ngôi Sao Khám Phá',
    position: { x: 65.0, y: 52.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 40 }],
    isRecommended: false
  },
  {
    nodeID: 'n11',
    nodeType: 'bonusStar',
    name: 'Ngôi Sao Kỳ Thú',
    position: { x: 80.0, y: 52.0 },
    nextNodes: [],
    requirements: [{ type: 'Fragment', value: 40 }],
    isRecommended: false
  },

  // Hàng 3 (Y: 80%): 4 Node bonusStarGem (Đá quý thượng giới)
  {
    nodeID: 'n12',
    nodeType: 'bonusStarGem',
    name: 'Huyền Thoại Tinh Tú',
    position: { x: 24.5, y: 80.0 },
    nextNodes: [],
    requirements: [{ type: 'Gemstone', value: 150 }],
    isRecommended: false
  },
  {
    nodeID: 'n13',
    nodeType: 'bonusStarGem',
    name: 'Tài Lộc Thượng Giới',
    position: { x: 41.5, y: 80.0 },
    nextNodes: [],
    requirements: [{ type: 'Gemstone', value: 250 }],
    isRecommended: false
  },
  {
    nodeID: 'n14',
    nodeType: 'bonusStarGem',
    name: 'Tiền Thưởng Thượng Giới',
    position: { x: 58.5, y: 80.0 },
    nextNodes: [],
    requirements: [{ type: 'Gemstone', value: 250 }],
    isRecommended: false
  },
  {
    nodeID: 'n15',
    nodeType: 'bonusStarGem',
    name: 'Thấu Thị Thượng Giới',
    position: { x: 75.5, y: 80.0 },
    nextNodes: [],
    requirements: [{ type: 'Gemstone', value: 350 }],
    isRecommended: false
  }
];

export default function ConstellationEditor({
  constellation = {},
  onChange,
  powers = [],
  bonusStars = [],
  championName = '',
  championID = ''
}) {
  const nodes = constellation.nodes || [];
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [activeDragOverIdx, setActiveDragOverIdx] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // State nối node nhanh
  const [fromNode, setFromNode] = useState('');
  const [toNode, setToNode] = useState('');

  const mapRef = useRef(null);

  // Đóng Context Menu khi click ra ngoài
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, [contextMenu]);

  // 1. Chấm vị trí Node trên bản đồ (Click to place)
  const handleMapClick = (e) => {
    if (contextMenu) {
      setContextMenu(null);
      return;
    }
    if (selectedNodeIndex === null || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    const nextNodes = [...nodes];
    if (nextNodes[selectedNodeIndex]) {
      nextNodes[selectedNodeIndex] = {
        ...nextNodes[selectedNodeIndex],
        position: { x, y }
      };
      onChange({ ...constellation, nodes: nextNodes });
    }
  };

  // 1b. Mở Context Menu tạo nhanh Node khi ấn chuột phải lên Map
  const handleMapContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const percentX = parseFloat(((xPx / rect.width) * 100).toFixed(1));
    const percentY = parseFloat(((yPx / rect.height) * 100).toFixed(1));

    const menuWidth = 220;
    const menuHeight = 170;

    let renderX = xPx;
    let renderY = yPx;

    if (xPx + menuWidth > rect.width) renderX = rect.width - menuWidth - 10;
    if (yPx + menuHeight > rect.height) renderY = rect.height - menuHeight - 10;
    if (renderX < 10) renderX = 10;
    if (renderY < 10) renderY = 10;

    setContextMenu({
      x: renderX,
      y: renderY,
      percentX,
      percentY
    });
  };

  // Tạo nhanh Node tại vị trí chuột phải
  const handleCreateNodeAtPos = (type, percentX, percentY) => {
    const nextNodes = [...nodes];
    const nextIdx = nextNodes.length + 1;
    let newID = `n${nextIdx}`;
    let attempt = 0;
    while (nextNodes.some((n) => n.nodeID === newID) && attempt < 100) {
      attempt++;
      newID = `n${nextIdx + attempt}`;
    }

    const tpl = STANDARD_CONSTELLATION_NODES.find((s) => s.nodeID === newID) || {
      requirements:
        type === 'starPower'
          ? [{ type: 'Fragment', value: 40 }]
          : type === 'bonusStar'
          ? [{ type: 'Fragment', value: 40 }]
          : [{ type: 'Gemstone', value: 250 }]
    };

    const typeLabel =
      type === 'starPower' ? 'Sức Mạnh' : type === 'bonusStar' ? 'Ngôi Sao' : 'Thượng Giới';

    const newNode = {
      nodeID: newID,
      name: `${typeLabel} ${newID.toUpperCase()}`,
      nodeType: type,
      position: { x: percentX, y: percentY },
      nextNodes: [],
      requirements: JSON.parse(JSON.stringify(tpl.requirements || [{ type: 'Fragment', value: 40 }])),
      isRecommended: type === 'starPower'
    };

    const updated = [...nextNodes, newNode];
    onChange({ ...constellation, nodes: updated });
    setSelectedNodeIndex(updated.length - 1);
    setContextMenu(null);
  };

  // 2. Thả Power hoặc BonusStar vào Node trên bản đồ hoặc trong danh sách
  const handleDropOnNode = (e, nodeIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDragOverIdx(null);

    let rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const dragged = typeof rawData === 'string' && rawData.startsWith('{') ? JSON.parse(rawData) : { code: rawData };
      const nextNodes = [...nodes];
      const targetNode = nextNodes[nodeIdx];
      if (!targetNode) return;

      const code = dragged.code || dragged.id || dragged.bonusStarID || dragged.powerCode || '';
      let updates = {};

      if (dragged.type === 'power' || (!dragged.type && powers.some((p) => p.powerCode === code))) {
        const found = powers.find((p) => p.powerCode === code) || dragged;
        updates = {
          nodeType: 'starPower',
          powerCode: code,
          name: found.name || targetNode.name,
          description: found.descriptionRaw || found.description || targetNode.description || '',
          image: found.image || ''
        };
      } else if (
        dragged.type === 'bonusStar' ||
        (!dragged.type && bonusStars.some((b) => b.bonusStarID === code))
      ) {
        const found = bonusStars.find((b) => b.bonusStarID === code) || dragged;
        updates = {
          nodeType: found.nodeType || (nodeIdx >= 11 ? 'bonusStarGem' : 'bonusStar'),
          bonusStarID: code,
          name: found.name || targetNode.name,
          description: found.descriptionRaw || found.description || targetNode.description || '',
          image: found.image || ''
        };
      } else {
        updates = {
          name: dragged.name || code,
          powerCode: code
        };
      }

      nextNodes[nodeIdx] = { ...targetNode, ...updates };
      onChange({ ...constellation, nodes: nextNodes });
    } catch (err) {
      console.warn('Lỗi khi thả vào Node chòm sao:', err);
    }
  };

  // 3. Tự động Fill 15 Node chuẩn 6 sao (Sắp xếp ngay ngắn, không nối dây)
  const handleAutoFillStandardNodes = () => {
    const confirmFill = window.confirm(
      'Tự động khởi tạo 15 Node chuẩn cho tướng 6 sao (6 Star Powers + 5 Bonus Stars + 4 Thượng Giới)?\nCác node sẽ được xếp ngay ngắn thành 3 hàng, không nối dây để bạn tự dời vị trí.'
    );
    if (!confirmFill) return;

    const mergedNodes = STANDARD_CONSTELLATION_NODES.map((tpl, i) => {
      const existing = nodes[i];
      if (existing) {
        return {
          ...tpl,
          ...existing,
          nodeID: tpl.nodeID,
          nodeType: existing.nodeType || tpl.nodeType,
          requirements:
            Array.isArray(existing.requirements) && existing.requirements.length > 0
              ? existing.requirements
              : tpl.requirements,
          position: tpl.position, // Xếp ngay ngắn theo hàng
          nextNodes: [] // Không nối dây theo yêu cầu
        };
      }
      return { ...tpl, nextNodes: [] };
    });

    onChange({
      ...constellation,
      constellationID: constellation.constellationID || championID,
      championName: constellation.championName || championName,
      nodes: mergedNodes
    });
    setSelectedNodeIndex(0);
  };

  // 4. Thêm Node Mới
  const handleAddCustomNode = () => {
    const nextIdx = nodes.length + 1;
    const newID = `n${nextIdx}`;
    const tpl = STANDARD_CONSTELLATION_NODES[nextIdx - 1] || {
      nodeType: nextIdx <= 6 ? 'starPower' : nextIdx <= 11 ? 'bonusStar' : 'bonusStarGem',
      requirements: [{ type: 'Fragment', value: 40 }]
    };

    const newNode = {
      nodeID: newID,
      name: `Node ${nextIdx}`,
      nodeType: tpl.nodeType,
      position: { x: 50, y: 50 },
      nextNodes: [],
      requirements: JSON.parse(JSON.stringify(tpl.requirements || [{ type: 'Fragment', value: 40 }])),
      isRecommended: nextIdx <= 6
    };

    const updated = [...nodes, newNode];
    onChange({ ...constellation, nodes: updated });
    setSelectedNodeIndex(updated.length - 1);
  };

  // 5. Xóa Node
  const handleRemoveNode = (idx) => {
    const target = nodes[idx];
    if (!target) return;
    const targetID = target.nodeID;
    const updated = nodes
      .filter((_, i) => i !== idx)
      .map((n) => ({
        ...n,
        nextNodes: (n.nextNodes || []).filter((id) => id !== targetID)
      }));

    onChange({ ...constellation, nodes: updated });
    if (selectedNodeIndex >= updated.length) {
      setSelectedNodeIndex(Math.max(0, updated.length - 1));
    }
  };

  // 6. Quản lý liên kết (Connections)
  const connections = useMemo(() => {
    const list = [];
    nodes.forEach((node) => {
      (node.nextNodes || []).forEach((targetID) => {
        list.push({ from: node.nodeID, to: targetID });
      });
    });
    return list;
  }, [nodes]);

  const handleAddConnection = () => {
    const fromClean = fromNode.trim();
    const toClean = toNode.trim();
    if (!fromClean || !toClean) return;
    if (fromClean === toClean) {
      alert('Node bắt đầu và đích không được trùng nhau.');
      return;
    }

    const startIdx = nodes.findIndex((n) => n.nodeID === fromClean);
    const targetIdx = nodes.findIndex((n) => n.nodeID === toClean);
    if (startIdx === -1 || targetIdx === -1) {
      alert(`Không tìm thấy node "${fromClean}" hoặc "${toClean}"`);
      return;
    }

    const startNode = nodes[startIdx];
    const curNext = startNode.nextNodes || [];
    if (curNext.includes(toClean)) return;

    const nextNodes = [...nodes];
    nextNodes[startIdx] = {
      ...startNode,
      nextNodes: [...curNext, toClean]
    };
    onChange({ ...constellation, nodes: nextNodes });
    setFromNode('');
    setToNode('');
  };

  const handleRemoveConnection = (fromID, toID) => {
    const startIdx = nodes.findIndex((n) => n.nodeID === fromID);
    if (startIdx === -1) return;
    const nextNodes = [...nodes];
    nextNodes[startIdx] = {
      ...nextNodes[startIdx],
      nextNodes: (nextNodes[startIdx].nextNodes || []).filter((t) => t !== toID)
    };
    onChange({ ...constellation, nodes: nextNodes });
  };

  // Nối nhanh bằng Ctrl + Click trên node khác
  const handleNodeDotClick = (e, i) => {
    e.stopPropagation();
    if ((e.ctrlKey || e.metaKey) && selectedNodeIndex !== null && selectedNodeIndex !== i) {
      const startNode = nodes[selectedNodeIndex];
      const targetNode = nodes[i];
      if (startNode && targetNode) {
        const curNext = startNode.nextNodes || [];
        if (!curNext.includes(targetNode.nodeID)) {
          const nextNodes = [...nodes];
          nextNodes[selectedNodeIndex] = {
            ...startNode,
            nextNodes: [...curNext, targetNode.nodeID]
          };
          onChange({ ...constellation, nodes: nextNodes });
        }
      }
    }
    setSelectedNodeIndex(i);
  };

  const selectedNode = nodes[selectedNodeIndex] || null;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Ảnh nền & Nút Tự Động Điền 15 Node */}
      <div className="p-4 rounded-xl bg-[#070a10] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h4 className="text-sm font-bold font-heading text-white uppercase tracking-wider flex items-center gap-2">
              <span>⭐</span> Thiết Lập Chòm Sao ({nodes.length} Nodes)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Chuẩn 6 sao: 6 Node Sức Mạnh (n1-n6), 5 Node Bonus Star (n7-n11), 4 Node Thượng Giới (n12-n15).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAutoFillStandardNodes}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer font-heading flex items-center gap-1.5 shadow"
              title="Tự động khởi tạo 15 node với tài nguyên và liên kết chuẩn"
            >
              <span>⚡</span>
              <span>Auto-Fill 15 Node Chuẩn</span>
            </button>

            <button
              type="button"
              onClick={handleAddCustomNode}
              className="px-3 py-2 rounded-xl bg-[#0b2545] hover:bg-sky-600 border border-sky-400 text-sky-200 text-xs font-bold transition-all cursor-pointer font-heading flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Thêm Node</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMapVisible(!isMapVisible)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {isMapVisible ? 'Ẩn Bản Đồ' : 'Hiện Bản Đồ'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            URL Ảnh Nền Chòm Sao (Background Image)
          </label>
          <input
            type="text"
            value={constellation.backgroundImage || ''}
            onChange={(e) => onChange({ ...constellation, backgroundImage: e.target.value })}
            placeholder="https://dd.b.pvp.net/.../cards/06RU026T3-full.png"
            className="w-full px-3.5 py-2 rounded-xl bg-[#0e1320] border border-white/15 text-white text-xs font-mono focus:border-[#8CC0EB] focus:outline-none"
          />
        </div>
      </div>

      {/* 2. Visual Layout: Bản Đồ Trực Quan (Trái) & Công Cụ Nối/Chỉnh Node (Phải) */}
      <div className={`grid grid-cols-1 ${isMapVisible ? 'xl:grid-cols-2' : ''} gap-6 items-start`}>
        {/* CỘT TRÁI: BẢN ĐỒ CHÒM SAO INTERACTIVE */}
        {isMapVisible && (
          <div className="space-y-3 sticky top-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider font-heading">
                Bản Đồ Điểm Nút Chòm Sao
              </span>
              <span className="text-[11px] text-amber-300">
                {selectedNode
                  ? `Đang chọn ${selectedNode.nodeID} (${selectedNode.position?.x ?? 50}%, ${selectedNode.position?.y ?? 50}%) - Bấm vào ảnh để chấm tọa độ`
                  : 'Bấm chọn một node để chấm tọa độ'}
              </span>
            </div>

            <div
              ref={mapRef}
              onClick={handleMapClick}
              onContextMenu={handleMapContextMenu}
              className="relative aspect-video w-full bg-[#05070c] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl cursor-crosshair select-none group"
              title="Chuột trái: Đặt tọa độ Node đang chọn | Chuột phải: Mở menu tạo nhanh Node | Ctrl + Click node khác: Nối node"
            >
              {/* Background Image */}
              {constellation.backgroundImage ? (
                <img
                  src={constellation.backgroundImage}
                  alt="Constellation Map"
                  className="w-full h-full object-cover opacity-60 pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                  Chưa có ảnh nền chòm sao
                </div>
              )}

              {/* SVG Layer: Đường nối giữa các Node có mũi tên */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrowhead-normal"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(234, 179, 8, 0.5)" />
                  </marker>
                  <marker
                    id="arrowhead-rec"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(234, 179, 8, 1)" />
                  </marker>
                </defs>

                {nodes.map((node) =>
                  (node.nextNodes || []).map((targetID) => {
                    const target = nodes.find((n) => n.nodeID === targetID);
                    if (!target || !node.position || !target.position) return null;
                    const isRec = node.isRecommended && target.isRecommended;

                    return (
                      <line
                        key={`${node.nodeID}-${targetID}`}
                        x1={`${node.position.x}%`}
                        y1={`${node.position.y}%`}
                        x2={`${target.position.x}%`}
                        y2={`${target.position.y}%`}
                        stroke={isRec ? 'rgba(234, 179, 8, 1)' : 'rgba(234, 179, 8, 0.4)'}
                        strokeWidth={isRec ? '2.5' : '1.5'}
                        strokeDasharray={isRec ? '0' : '6,4'}
                        markerEnd={`url(#${isRec ? 'arrowhead-rec' : 'arrowhead-normal'})`}
                      />
                    );
                  })
                )}
              </svg>

              {/* Node Dots on Map */}
              {nodes.map((n, i) => {
                const isSelected = selectedNodeIndex === i;
                const isDragOver = activeDragOverIdx === i;
                const isStarPower = n.nodeType === 'starPower';
                const isGem = n.nodeType === 'bonusStarGem';

                let dotBg = 'bg-sky-500 border-sky-300';
                if (isStarPower) dotBg = 'bg-amber-500 border-amber-300';
                if (isGem) dotBg = 'bg-purple-500 border-purple-300';

                return (
                  <div
                    key={n.nodeID || i}
                    onClick={(e) => handleNodeDotClick(e, i)}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedNodeIndex(i);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDragOverIdx(i);
                    }}
                    onDragLeave={() => {
                      if (activeDragOverIdx === i) setActiveDragOverIdx(null);
                    }}
                    onDrop={(e) => handleDropOnNode(e, i)}
                    style={{
                      left: `${n.position?.x ?? 50}%`,
                      top: `${n.position?.y ?? 50}%`
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-20 ${
                      isSelected
                        ? 'ring-4 ring-white border-white scale-125 z-40 shadow-[0_0_15px_rgba(255,255,255,1)]'
                        : isDragOver
                        ? 'bg-emerald-500 border-emerald-300 ring-4 ring-emerald-400 scale-125 z-40'
                        : `${dotBg} hover:scale-110 shadow-md`
                    }`}
                    title={`${n.nodeID}: ${n.name || ''}\n(Click để chọn, Ctrl + Click node khác để nối)`}
                  >
                    <span className="text-white text-[10px] font-black drop-shadow">
                      {isStarPower ? '⭐' : isGem ? '💎' : '✦'}
                    </span>
                    <span className="absolute -bottom-4 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-white whitespace-nowrap pointer-events-none border border-white/10">
                      {n.nodeID}
                    </span>
                  </div>
                );
              })}

              {/* Context Menu khi nhấp chuột phải trên Map */}
              {contextMenu && (
                <>
                  {/* Pinpoint Indicator tại tọa độ click */}
                  <div
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-white pointer-events-none z-50 animate-ping shadow-[0_0_12px_rgba(251,191,36,1)]"
                    style={{ left: `${contextMenu.percentX}%`, top: `${contextMenu.percentY}%` }}
                  />
                  <div
                    className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 border border-white pointer-events-none z-50 shadow-[0_0_8px_rgba(245,158,11,1)]"
                    style={{ left: `${contextMenu.percentX}%`, top: `${contextMenu.percentY}%` }}
                  />

                  {/* Context Menu Popup Card */}
                  <div
                    className="absolute bg-[#0b101b]/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-2 w-52 z-50 flex flex-col gap-1 select-none animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 mb-1 flex justify-between items-center font-heading">
                      <span>Tạo Node tại đây</span>
                      <span className="font-mono text-amber-300">
                        {contextMenu.percentX}% {contextMenu.percentY}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCreateNodeAtPos('starPower', contextMenu.percentX, contextMenu.percentY)}
                      className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-amber-500/20 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
                    >
                      <span className="shrink-0 text-sm">⭐</span>
                      <div className="flex-1 truncate">
                        <span className="font-bold text-amber-300 block leading-tight">Star Power</span>
                        <span className="text-[10px] text-slate-400">Sức mạnh chòm sao</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateNodeAtPos('bonusStar', contextMenu.percentX, contextMenu.percentY)}
                      className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-sky-500/20 border border-transparent hover:border-sky-500/30 transition-all cursor-pointer"
                    >
                      <span className="shrink-0 text-sm">✦</span>
                      <div className="flex-1 truncate">
                        <span className="font-bold text-sky-300 block leading-tight">Bonus Star</span>
                        <span className="text-[10px] text-slate-400">Ngôi sao thường</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateNodeAtPos('bonusStarGem', contextMenu.percentX, contextMenu.percentY)}
                      className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-purple-500/20 border border-transparent hover:border-purple-500/30 transition-all cursor-pointer"
                    >
                      <span className="shrink-0 text-sm">💎</span>
                      <div className="flex-1 truncate">
                        <span className="font-bold text-purple-300 block leading-tight">Bonus Star Gem</span>
                        <span className="text-[10px] text-slate-400">Thượng giới (Đá quý)</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Mẹo: Bấm chọn 1 node, sau đó giữ <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Ctrl</kbd> và bấm vào một node khác trên bản đồ để nối nhanh 2 node.
            </p>
          </div>
        )}

        {/* CỘT PHẢI: QUẢN LÝ LIÊN KẾT & DANH SÁCH CHI TIẾT NODES */}
        <div className="space-y-6">
          {/* A. Quản lý liên kết (Constellation Connections) */}
          <div className="p-4 rounded-xl bg-[#070a10] border border-white/10 space-y-3">
            <h5 className="text-xs font-bold font-heading text-[#8CC0EB] uppercase tracking-wider flex items-center gap-1.5">
              <span>🔗</span> Quản Lý Đường Nối (Connections)
            </h5>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={fromNode}
                onChange={(e) => setFromNode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddConnection()}
                placeholder="Từ Node (VD: n1)"
                className="w-32 px-3 py-1.5 rounded-lg bg-[#0e1320] border border-white/15 text-white text-xs font-mono"
              />
              <span className="text-slate-400 text-xs font-bold">→</span>
              <input
                type="text"
                value={toNode}
                onChange={(e) => setToNode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddConnection()}
                placeholder="Đến Node (VD: n2)"
                className="w-32 px-3 py-1.5 rounded-lg bg-[#0e1320] border border-white/15 text-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddConnection}
                className="px-3 py-1.5 rounded-lg bg-[#8CC0EB] hover:bg-sky-400 text-[#07090e] font-bold text-xs font-heading cursor-pointer transition-colors"
              >
                + Nối
              </button>
            </div>

            {/* Danh sách các kết nối hiện tại */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
              {connections.length === 0 ? (
                <span className="text-xs text-slate-500 italic">Chưa có liên kết nào giữa các node.</span>
              ) : (
                connections.map((c) => (
                  <span
                    key={`${c.from}-${c.to}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1320] border border-white/10 text-xs font-mono text-slate-300"
                  >
                    <strong className="text-amber-300">{c.from}</strong>
                    <span className="text-slate-500">→</span>
                    <strong className="text-sky-300">{c.to}</strong>
                    <button
                      type="button"
                      onClick={() => handleRemoveConnection(c.from, c.to)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                      title="Xóa kết nối"
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* B. Danh Sách Chi Tiết Từng Node */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-heading text-slate-300 uppercase tracking-wider">
                Danh Sách Nodes ({nodes.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Kéo thả Sức Mạnh / Ngôi Sao từ Menu bên phải vào từng Node
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {nodes.map((node, idx) => {
                const isSelected = selectedNodeIndex === idx;
                const isStarPower = node.nodeType === 'starPower';
                const isGem = node.nodeType === 'bonusStarGem';

                let badgeColor = 'bg-sky-950/60 text-sky-300 border-sky-500/40';
                if (isStarPower) badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
                if (isGem) badgeColor = 'bg-purple-950/60 text-purple-300 border-purple-500/40';

                return (
                  <div
                    key={node.nodeID || idx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDragOverIdx(idx);
                    }}
                    onDragLeave={() => {
                      if (activeDragOverIdx === idx) setActiveDragOverIdx(null);
                    }}
                    onDrop={(e) => handleDropOnNode(e, idx)}
                    onClick={() => setSelectedNodeIndex(idx)}
                    className={`p-4 rounded-xl border transition-all space-y-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0f172a] border-[#8CC0EB] shadow-lg'
                        : activeDragOverIdx === idx
                        ? 'bg-emerald-950/40 border-emerald-400'
                        : 'bg-[#070a10] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Header Card Node */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${badgeColor}`}>
                          {node.nodeID}
                        </span>

                        <input
                          type="text"
                          value={node.name || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const copy = [...nodes];
                            copy[idx] = { ...node, name: e.target.value };
                            onChange({ ...constellation, nodes: copy });
                          }}
                          placeholder="Tên Node (Kéo thả từ menu kéo thả để điền tự động)"
                          className="px-2.5 py-1 rounded-lg bg-[#0e1320] border border-white/15 text-white font-bold text-xs focus:border-[#8CC0EB] focus:outline-none w-52 sm:w-64"
                        />
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center gap-1.5 text-xs text-amber-300 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(node.isRecommended)}
                            onChange={(e) => {
                              const copy = [...nodes];
                              copy[idx] = { ...node, isRecommended: e.target.checked };
                              onChange({ ...constellation, nodes: copy });
                            }}
                            className="rounded accent-amber-400"
                          />
                          <span>Khuyên dùng</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveNode(idx)}
                          className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-bold"
                          title="Xóa node này"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Node Type & Binding Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Loại Node</label>
                        <select
                          value={node.nodeType || 'starPower'}
                          onChange={(e) => {
                            const copy = [...nodes];
                            copy[idx] = { ...node, nodeType: e.target.value };
                            onChange({ ...constellation, nodes: copy });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e1320] border border-white/15 text-white text-xs font-medium focus:outline-none"
                        >
                          <option value="starPower">Star Power (Sức Mạnh)</option>
                          <option value="bonusStar">Bonus Star (Ngôi Sao Thường)</option>
                          <option value="bonusStarGem">Bonus Star Gem (Thượng Giới)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {node.nodeType === 'starPower' ? 'Mã Sức Mạnh (powerCode)' : 'Mã Ngôi Sao (bonusStarID)'}
                        </label>
                        <input
                          type="text"
                          value={node.powerCode || node.bonusStarID || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim().toUpperCase();
                            const copy = [...nodes];
                            if (node.nodeType === 'starPower') {
                              copy[idx] = { ...node, powerCode: val };
                            } else {
                              copy[idx] = { ...node, bonusStarID: val };
                            }
                            onChange({ ...constellation, nodes: copy });
                          }}
                          placeholder={node.nodeType === 'starPower' ? 'VD: P1092' : 'VD: C0001'}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e1320] border border-white/15 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Tọa độ X%, Y%</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={node.position?.x ?? 50}
                            onChange={(e) => {
                              const copy = [...nodes];
                              copy[idx] = {
                                ...node,
                                position: { ...(node.position || {}), x: parseFloat(e.target.value) || 0 }
                              };
                              onChange({ ...constellation, nodes: copy });
                            }}
                            className="w-1/2 px-2 py-1.5 rounded-lg bg-[#0e1320] border border-white/15 text-white font-mono text-xs text-center"
                            placeholder="X%"
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={node.position?.y ?? 50}
                            onChange={(e) => {
                              const copy = [...nodes];
                              copy[idx] = {
                                ...node,
                                position: { ...(node.position || {}), y: parseFloat(e.target.value) || 0 }
                              };
                              onChange({ ...constellation, nodes: copy });
                            }}
                            className="w-1/2 px-2 py-1.5 rounded-lg bg-[#0e1320] border border-white/15 text-white font-mono text-xs text-center"
                            placeholder="Y%"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Requirements List (Tài nguyên nâng cấp) */}
                    <div className="pt-2 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Tài Nguyên Mở Khóa ({node.requirements?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...nodes];
                            const curReqs = Array.isArray(node.requirements) ? node.requirements : [];
                            copy[idx] = {
                              ...node,
                              requirements: [...curReqs, { type: 'Fragment', value: 40 }]
                            };
                            onChange({ ...constellation, nodes: copy });
                          }}
                          className="text-[11px] text-[#8CC0EB] hover:underline font-bold cursor-pointer"
                        >
                          + Thêm tài nguyên
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(node.requirements || []).map((req, rIdx) => (
                          <div
                            key={rIdx}
                            className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-[#0e1320] border border-white/15 text-xs"
                          >
                            <select
                              value={req.type || 'Fragment'}
                              onChange={(e) => {
                                const copy = [...nodes];
                                const nextReqs = [...copy[idx].requirements];
                                nextReqs[rIdx] = { ...nextReqs[rIdx], type: e.target.value };
                                copy[idx] = { ...node, requirements: nextReqs };
                                onChange({ ...constellation, nodes: copy });
                              }}
                              className="bg-transparent text-white font-medium text-xs focus:outline-none"
                            >
                              <option value="Fragment" className="bg-[#0e1320]">Mảnh tướng (Fragment)</option>
                              <option value="Crystal" className="bg-[#0e1320]">Tinh thể (Crystal)</option>
                              <option value="Nova Crystal" className="bg-[#0e1320]">Pha Lê Sao Băng (Nova Crystal)</option>
                              <option value="Gemstone" className="bg-[#0e1320]">Đá Quý (Gemstone)</option>
                            </select>

                            <input
                              type="number"
                              min="0"
                              value={req.value ?? 0}
                              onChange={(e) => {
                                const copy = [...nodes];
                                const nextReqs = [...copy[idx].requirements];
                                nextReqs[rIdx] = { ...nextReqs[rIdx], value: parseInt(e.target.value, 10) || 0 };
                                copy[idx] = { ...node, requirements: nextReqs };
                                onChange({ ...constellation, nodes: copy });
                              }}
                              className="w-16 px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono font-bold text-xs text-center border border-white/10"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...nodes];
                                copy[idx] = {
                                  ...node,
                                  requirements: copy[idx].requirements.filter((_, ri) => ri !== rIdx)
                                };
                                onChange({ ...constellation, nodes: copy });
                              }}
                              className="text-slate-500 hover:text-rose-400 px-1 cursor-pointer"
                              title="Xóa yêu cầu này"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
