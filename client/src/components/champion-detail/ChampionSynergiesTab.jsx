import React, { useState } from 'react';
import LorMarkup from '../LorMarkup';
import { getRarityBadgeStyle } from './constants';
import { handleImageError } from '../../utils/imageFallback';

export default function ChampionSynergiesTab({ champion, powerMap, itemMap, isEn, navigateTo }) {
  const [synergySubTab, setSynergySubTab] = useState('powers');

  return (
    <div id="synergies" className="p-2 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/15 sm:border-2 shadow-xl space-y-3 sm:space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-4 border-b border-white/10 gap-2 sm:gap-4">
        <h3 className="text-sm sm:text-base font-bold font-heading text-white">
          {isEn ? 'Items & Powers' : 'Vật Phẩm & Sức Mạnh'}
        </h3>

        {/* Sub-tabs: Sức Mạnh / Vật Phẩm */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-[#070a10] border border-white/15 shrink-0 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setSynergySubTab('powers')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              synergySubTab === 'powers'
                ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEn ? 'Powers' : 'Sức Mạnh'}
          </button>
          <button
            type="button"
            onClick={() => setSynergySubTab('items')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              synergySubTab === 'items'
                ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEn ? 'Items' : 'Vật Phẩm'}
          </button>
        </div>
      </div>

      {/* Danh sách Sức Mạnh */}
      {synergySubTab === 'powers' && (
        <div>
          {(champion.adventurePowerIds || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {(champion.adventurePowerIds || []).map((code) => {
                const powerData = powerMap[code];
                const pName = (isEn ? powerData?.translations?.en?.name : powerData?.name) || powerData?.name || code;
                const pDesc = (isEn ? (powerData?.translations?.en?.description || powerData?.translations?.en?.descriptionRaw) : (powerData?.description || powerData?.descriptionRaw)) || powerData?.description || '';
                const pRarity = (isEn ? powerData?.translations?.en?.rarity : powerData?.rarity) || powerData?.rarity;
                const pImage = powerData?.assetAbsolutePath || `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${code}.png`;

                return (
                  <div
                    key={code}
                    onClick={() => navigateTo('power', code)}
                    className="group flex items-start gap-2.5 p-2 sm:p-3 rounded-xl bg-[#090d16] border border-white/10 hover:border-[#8CC0EB]/50 transition-all cursor-pointer hover:-translate-y-0.5 shadow-md"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#070a10] border border-white/15 p-1 flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                      <img
                        src={pImage}
                        alt={pName}
                        loading="lazy"
                        className="w-full h-full object-contain"
                        onError={(e) => handleImageError(e, 'power', 'https://images.lortpoc.com/icon/starIcon.webp')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#8CC0EB] truncate transition-colors" title={pName}>
                          {pName}
                        </h4>
                        {pRarity && (
                          <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-semibold border shrink-0 ${getRarityBadgeStyle(pRarity)}`}>
                            {pRarity}
                          </span>
                        )}
                      </div>
                      {pDesc && (
                        <div className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                          <LorMarkup text={pDesc} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs sm:text-sm text-slate-400 bg-[#090d16] rounded-xl border border-white/10">
              {isEn ? 'No adventure powers recorded.' : 'Chưa có thông tin sức mạnh gợi ý.'}
            </div>
          )}
        </div>
      )}

      {/* Danh sách Vật Phẩm */}
      {synergySubTab === 'items' && (
        <div>
          {(champion.itemIds || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {(champion.itemIds || []).map((code) => {
                const itemData = itemMap[code];
                const iName = (isEn ? itemData?.translations?.en?.name : itemData?.name) || itemData?.name || code;
                const iDesc = (isEn ? (itemData?.translations?.en?.description || itemData?.translations?.en?.descriptionRaw) : (itemData?.description || itemData?.descriptionRaw)) || itemData?.description || '';
                const iRarity = (isEn ? itemData?.translations?.en?.rarity : itemData?.rarity) || itemData?.rarity;
                const iImage = itemData?.assetAbsolutePath || 'https://images.lortpoc.com/icon/itemIcon.webp';

                return (
                  <div
                    key={code}
                    onClick={() => navigateTo('item', code)}
                    className="group flex items-start gap-2.5 p-2 sm:p-3 rounded-xl bg-[#090d16] border border-white/10 hover:border-[#8CC0EB]/50 transition-all cursor-pointer hover:-translate-y-0.5 shadow-md"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#070a10] border border-white/15 p-1 flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                      <img
                        src={iImage}
                        alt={iName}
                        loading="lazy"
                        className="w-full h-full object-contain"
                        onError={(e) => handleImageError(e, 'item', 'https://images.lortpoc.com/icon/itemIcon.webp')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#8CC0EB] truncate transition-colors" title={iName}>
                          {iName}
                        </h4>
                        {iRarity && (
                          <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-semibold border shrink-0 ${getRarityBadgeStyle(iRarity)}`}>
                            {iRarity}
                          </span>
                        )}
                      </div>
                      {iDesc && (
                        <div className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                          <LorMarkup text={iDesc} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs sm:text-sm text-slate-400 bg-[#090d16] rounded-xl border border-white/10">
              {isEn ? 'No items recorded.' : 'Chưa có thông tin vật phẩm gợi ý.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
