import React, { useState, useCallback, useEffect } from 'react';
import EntityDetailModal from './EntityDetailModal';
import { useLanguage } from '../context/LanguageContext';
import {
  ChampionOverviewHeader,
  ChampionDetailTabNav,
  ChampionRelicBuildsTab,
  ChampionStrategyTab,
  ChampionSynergiesTab,
  ChampionConstellationTab,
  ChampionStartingDeckTab,
  parseSuitableRelics
} from './champion-detail';

// Module-level in-memory cache for dictionaries to optimize rendering & avoid re-fetching
let cachedRelicsMap = null;
let cachedCardsMap = null;
let cachedItemsMap = null;
let cachedPowersMap = null;

const HASH_TO_TAB = {
  relics: 'builds',
  builds: 'builds',
  combos: 'combos',
  strategy: 'combos',
  synergies: 'synergies',
  powers: 'synergies',
  items: 'synergies',
  constellation: 'constellation',
  deck: 'deck'
};

const TAB_TO_HASH = {
  builds: 'relics',
  combos: 'strategy',
  synergies: 'synergies',
  constellation: 'constellation',
  deck: 'deck'
};

function getTabFromHash(hashString) {
  if (!hashString) return null;
  const clean = hashString.replace(/^#/, '').toLowerCase().trim();
  return HASH_TO_TAB[clean] || null;
}

export default function ChampionElementsDetail({
  champion,
  onSelectRelic,
  onSelectPower,
  onSelectItem,
  onSelectCard,
  currentHash,
  onHashChange,
  className = ''
}) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  // Navigate to dedicated entity detail pages (/relic/:code, /power/:code, /item/:code, /card/:code)
  const navigateTo = useCallback(
    (type, code) => {
      if (!code) return;
      if (type === 'relic' && onSelectRelic) {
        onSelectRelic(code);
        return;
      }
      if (type === 'power' && onSelectPower) {
        onSelectPower(code);
        return;
      }
      if (type === 'item' && onSelectItem) {
        onSelectItem(code);
        return;
      }
      if (type === 'card' && onSelectCard) {
        onSelectCard(code);
        return;
      }
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', `/${type}/${encodeURIComponent(code)}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    },
    [onSelectRelic, onSelectPower, onSelectItem, onSelectCard]
  );

  const [activeTab, setActiveTab] = useState(() => {
    if (currentHash) {
      const tab = getTabFromHash(currentHash);
      if (tab) return tab;
    }
    if (typeof window !== 'undefined' && window.location.hash) {
      const tab = getTabFromHash(window.location.hash);
      if (tab) return tab;
    }
    return 'builds';
  });

  // Sync when currentHash prop changes
  useEffect(() => {
    if (currentHash) {
      const tab = getTabFromHash(currentHash);
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    }
  }, [currentHash, activeTab]);

  // Sync on direct window hashchange (e.g. browser back/forward)
  useEffect(() => {
    const handleHash = () => {
      const tab = getTabFromHash(window.location.hash);
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [activeTab]);

  const handleTabSelect = useCallback((tabKey) => {
    setActiveTab(tabKey);
    const targetHash = TAB_TO_HASH[tabKey] || tabKey;
    if (onHashChange) {
      onHashChange(targetHash);
    } else if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}${window.location.search}#${targetHash}`;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  }, [onHashChange]);

  const [activeBuildIndex, setActiveBuildIndex] = useState(0);

  // Dynamic dictionaries for localized names & info (fed from server hydration)
  const [relicMap, setRelicMap] = useState(() => ({ ...(cachedRelicsMap || {}), ...(champion?.resolvedRelics || {}) }));
  const [cardMap, setCardMap] = useState(() => ({ ...(cachedCardsMap || {}), ...(champion?.resolvedCards || {}) }));
  const [itemMap, setItemMap] = useState(() => ({ ...(cachedItemsMap || {}), ...(champion?.resolvedItems || {}) }));
  const [powerMap, setPowerMap] = useState(() => ({ ...(cachedPowersMap || {}), ...(champion?.resolvedPowers || {}) }));
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [selectedEntityForModal, setSelectedEntityForModal] = useState(null);

  // Synchronize in-memory cumulative caches whenever champion changes
  useEffect(() => {
    if (!champion) return;

    if (champion.resolvedRelics) {
      cachedRelicsMap = { ...(cachedRelicsMap || {}), ...champion.resolvedRelics };
      setRelicMap(cachedRelicsMap);
    }
    if (champion.resolvedCards) {
      cachedCardsMap = { ...(cachedCardsMap || {}), ...champion.resolvedCards };
      setCardMap(cachedCardsMap);
    }
    if (champion.resolvedItems) {
      cachedItemsMap = { ...(cachedItemsMap || {}), ...champion.resolvedItems };
      setItemMap(cachedItemsMap);
    }
    if (champion.resolvedPowers) {
      cachedPowersMap = { ...(cachedPowersMap || {}), ...champion.resolvedPowers };
      setPowerMap(cachedPowersMap);
    }
  }, [champion]);

  // Fallback: If for any reason cards were not pre-hydrated (e.g. legacy props), fetch missing card codes on demand
  useEffect(() => {
    if (!champion || champion.resolvedCards) return;

    const baseCards = champion.startingDeck?.baseCards || [];
    const refCards = champion.startingDeck?.referenceCards || [];
    const allCodes = [...baseCards, ...refCards].map((c) => c.cardCode).filter(Boolean);
    if (allCodes.length === 0) return;

    const missingCodes = allCodes.filter((c) => !(cachedCardsMap && cachedCardsMap[c.toLowerCase()]));
    if (missingCodes.length === 0 && cachedCardsMap) {
      setCardMap(cachedCardsMap);
    } else {
      fetch(`/api/v1/cards?codes=${encodeURIComponent(allCodes.join(','))}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            const nextMap = { ...(cachedCardsMap || {}) };
            json.data.forEach((c) => {
              if (c.cardCode) {
                nextMap[c.cardCode.toLowerCase()] = c;
              }
            });
            cachedCardsMap = nextMap;
            setCardMap(nextMap);
          }
        })
        .catch((err) => console.error('Failed to load cards for deck:', err));
    }
  }, [champion]);

  if (!champion) return null;

  const enData = champion.translations?.en;
  const name = (isEn ? enData?.name : champion.name) || champion.name;
  const regions = Array.isArray(champion.regions) ? champion.regions : [champion.region || 'Runeterra'];
  const stars = champion.maxStar || 3;
  const rawTier = (isEn && enData?.tier ? enData.tier : champion.tier) || champion.tier || '';
  const tierParts = rawTier ? rawTier.split('//').map((s) => s.trim()) : [];
  const tierShort = tierParts[0] || (champion.tier ? champion.tier.split('//')[0].trim() : 'UNRANKED');
  const tierDesc = tierParts[1] || '';

  const avatarUrl =
    champion.assets?.[0]?.avatar ||
    champion.assets?.[0]?.gameAbsolutePath ||
    `https://images.lortpoc.com/avatarChampions/${champion.championID}.webp`;

  // Extract suitable relics (flexible or legacy) and other relic options
  const suitableData = parseSuitableRelics(champion.coreRelics, isEn, champion.translations);
  const otherRelicOptions = Array.isArray(champion.otherRelicOptions) ? champion.otherRelicOptions : [];
  const relicSets = champion.relicSets || [];

  const ratings = champion.ratings || {
    damage: 7,
    defense: 7,
    synergy: 7,
    difficulty: 5
  };

  const baseCardItems = champion.startingDeck?.baseCards || [];
  const refCardItems = champion.startingDeck?.referenceCards || [];
  const tags = (isEn && enData?.tags && enData.tags.length > 0 ? enData.tags : champion.tags) || [];

  // Constellation data
  const constellationNodes = champion.constellation?.nodes || [];
  const starPowers = constellationNodes.filter((n) => n.nodeType === 'starPower');
  const bonusStars = constellationNodes.filter((n) => n.nodeType !== 'starPower');

  return (
    <div className={`w-full flex flex-col gap-4 sm:gap-6 text-white font-sans ${className}`}>
      {/* 1. Champion Header & Overview Card */}
      <ChampionOverviewHeader
        champion={champion}
        name={name}
        stars={stars}
        regions={regions}
        tierShort={tierShort}
        tierDesc={tierDesc}
        avatarUrl={avatarUrl}
        ratings={ratings}
        tags={tags}
        isEn={isEn}
        t={t}
      />

      {/* 2. Navigation Tabs */}
      <ChampionDetailTabNav
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        isEn={isEn}
      />

      {/* 3. Tab Contents */}

      {/* 3.1 Tab: Relic Builds */}
      {activeTab === 'builds' && (
        <ChampionRelicBuildsTab
          champion={champion}
          suitableData={suitableData}
          relicSets={relicSets}
          activeBuildIndex={activeBuildIndex}
          setActiveBuildIndex={setActiveBuildIndex}
          relicMap={relicMap}
          isEn={isEn}
          navigateTo={navigateTo}
          otherRelicOptions={otherRelicOptions}
        />
      )}

      {/* 3.2 Tab: Strategy & Combos */}
      {activeTab === 'combos' && (
        <ChampionStrategyTab
          champion={champion}
          ratings={ratings}
          isEn={isEn}
        />
      )}

      {/* 3.3 Tab: Items & Powers */}
      {activeTab === 'synergies' && (
        <ChampionSynergiesTab
          champion={champion}
          powerMap={powerMap}
          itemMap={itemMap}
          isEn={isEn}
          navigateTo={navigateTo}
        />
      )}

      {/* 3.4 Tab: Constellation */}
      {activeTab === 'constellation' && (
        <ChampionConstellationTab
          champion={champion}
          starPowers={starPowers}
          bonusStars={bonusStars}
          isEn={isEn}
          navigateTo={navigateTo}
        />
      )}

      {/* 3.5 Tab: Starting Deck */}
      {activeTab === 'deck' && (
        <ChampionStartingDeckTab
          champion={champion}
          baseCardItems={baseCardItems}
          refCardItems={refCardItems}
          cardMap={cardMap}
          itemMap={itemMap}
          isEn={isEn}
          navigateTo={navigateTo}
        />
      )}

      {/* Selected Card Inspection Modal */}
      {selectedCardForModal && (
        <EntityDetailModal
          item={selectedCardForModal}
          type="card"
          onClose={() => setSelectedCardForModal(null)}
        />
      )}

      {/* Selected Power / Item Inspection Modal */}
      {selectedEntityForModal && (
        <EntityDetailModal
          item={selectedEntityForModal.item}
          type={selectedEntityForModal.type}
          onClose={() => setSelectedEntityForModal(null)}
        />
      )}
    </div>
  );
}
