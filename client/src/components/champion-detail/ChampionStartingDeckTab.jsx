import React, { useState } from 'react';

export default function ChampionStartingDeckTab({
  champion,
  baseCardItems,
  refCardItems,
  cardMap,
  itemMap,
  isEn,
  navigateTo
}) {
  const [deckSubTab, setDeckSubTab] = useState('base');

  return (
    <div id="deck" className="p-2 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/15 sm:border-2 shadow-xl space-y-3 sm:space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-4 border-b border-white/10 gap-2 sm:gap-4">
        <h3 className="text-sm sm:text-base font-bold font-heading text-white">
          {isEn ? 'Starting Deck' : 'Bộ bài khởi đầu'}
        </h3>

        {/* Sub-tabs if reference/associated cards exist */}
        {refCardItems && refCardItems.length > 0 && (
          <div className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-[#070a10] border border-white/15 shrink-0 self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setDeckSubTab('base')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                deckSubTab === 'base'
                  ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isEn ? 'Base Deck' : 'Khởi Đầu'}
            </button>
            <button
              type="button"
              onClick={() => setDeckSubTab('reference')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                deckSubTab === 'reference'
                  ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isEn ? 'Associated' : 'Liên Quan'}
            </button>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
        {(deckSubTab === 'base' ? baseCardItems : refCardItems).map((c, idx) => {
          const cardData = cardMap[c.cardCode?.toLowerCase()];
          const cardName = (isEn ? cardData?.translations?.en?.cardName : cardData?.cardName) || cardData?.cardName || c.cardCode;
          const cardImage =
            (isEn ? cardData?.translations?.en?.gameAbsolutePath : null) ||
            cardData?.gameAbsolutePath ||
            `https://dd.b.pvp.net/latest/set1/vi_vn/img/cards/${c.cardCode}.png`;

          return (
            <div
              key={`${c.cardCode}-${idx}`}
              onClick={() => navigateTo('card', c.cardCode)}
              className="group relative flex flex-col items-center transition-all duration-200 cursor-pointer hover:-translate-y-1"
            >
              {/* Card Artwork Portrait Wrapper */}
              <div className="relative w-full aspect-[2/3] mb-1.5">
                {/* Inner image container */}
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={cardImage}
                    alt={cardName}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.lortpoc.com/icon/cardBack.webp';
                    }}
                  />
                </div>

                {/* Attached Items on right edge, vertically centered */}
                {c.itemCodes && c.itemCodes.length > 0 && (
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 z-20 flex flex-col gap-1.5 items-center pointer-events-auto">
                    {c.itemCodes.map((it, itIdx) => {
                      const itemData = itemMap[it.itemCode];
                      const itemName = (isEn ? itemData?.translations?.en?.name : itemData?.name) || itemData?.name || it.itemCode;
                      const itemIcon = itemData?.assetAbsolutePath || 'https://images.lortpoc.com/icon/itemIcon.webp';
                      return (
                        <div
                          key={itIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo('item', it.itemCode);
                          }}
                          className="relative flex items-center justify-center w-[53px] h-[53px] sm:w-[62px] sm:h-[62px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] transition-transform hover:scale-120 cursor-pointer pointer-events-auto"
                          title={itemName}
                        >
                          <img
                            src={itemIcon}
                            alt={itemName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.lortpoc.com/icon/itemIcon.webp';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Title & Count Badge */}
              <div className="w-full text-center mt-1">
                <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition-colors block truncate" title={cardName}>
                  {cardName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
