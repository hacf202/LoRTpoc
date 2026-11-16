/**
 * Comprehensive SEO Keywords Database & Generators
 * Inherited and enhanced from ThePathOfChampionGuide (POC GUIDE)
 * Supports bilingual (Vietnamese & English) search terms
 */

export const CORE_KEYWORDS_VI = [
  'lortpoc',
  'lortpoc.com',
  'lor tpoc',
  'con đường anh hùng',
  'con đường anh hùng guide',
  'hướng dẫn con đường anh hùng',
  'Hướng dẫn Con Đường Anh Hùng',
  'tướng con đường anh hùng',
  'cổ vật con đường anh hùng',
  'sức mạnh con đường anh hùng',
  'vật phẩm con đường anh hùng',
  'chòm sao con đường anh hùng',
  'bảng xếp hạng con đường anh hùng',
  'cuộc phiêu lưu con đường anh hùng',
  'boss con đường anh hùng',
  'build tướng con đường anh hùng',
  'cách chơi con đường anh hùng',
  'chiến thuật con đường anh hùng',
  'tướng mạnh nhất con đường anh hùng',
  'cổ vật tốt nhất con đường anh hùng',
  'sức mạnh 6 sao con đường anh hùng',
  'bộ bài khởi đầu con đường anh hùng',
  'Huyền Thoại Runeterra',
  'Huyền Thoại Runeterra con đường anh hùng',
  'cẩm nang PoC tiếng Việt',
  'PoC Việt Nam'
];

export const CORE_KEYWORDS_EN = [
  'lortpoc',
  'lortpoc.com',
  'lor tpoc',
  'The Path of Champions',
  'Path of Champions',
  'PoC Guide',
  'LoR PoC',
  'Legends of Runeterra PoC',
  'LoR Path of Champions',
  'The Path of Champions Guide',
  'The Path of Champions Database',
  'PoC champion guide',
  'PoC tier list',
  'PoC champion tier list',
  'best champions PoC',
  'PoC best builds',
  'PoC build guide',
  'PoC relic guide',
  'best relics PoC',
  'epic relics PoC',
  'best relics for champions',
  'PoC powers database',
  'PoC star powers',
  'PoC star powers list',
  'PoC constellation guide',
  'PoC 6 star champions',
  'PoC 6 star constellations',
  'PoC adventure guide',
  'PoC boss strategy',
  'PoC nightmares guide',
  'PoC monthly challenge guide',
  'PoC items database',
  'LoR card database',
  'LoR strategy guide',
  'Runeterra PoC meta',
  'Path of Champions 2025 2026'
];

export const ALL_CHAMPIONS_LIST = [
  'Aatrox', 'Ahri', 'Ambessa', 'Annie', 'Ashe', 'Aurelion Sol', 'Bard', 'Braum',
  'Caitlyn', 'Darius', 'Diana', 'Draven', 'Echo', 'Ekko', 'Elise', 'Evelynn',
  'Ezreal', 'Fiddlesticks', 'Fiora', 'Fizz', 'Galio', 'Garen', 'Gnar', 'Gwen',
  'Heimerdinger', 'Hecarim', 'Illaoi', 'Irelia', 'Jack', 'Janna', 'Jarvan IV',
  'Jax', 'Jayce', 'Jhin', 'Jinx', 'Kai\'Sa', 'Kalista', 'Karma', 'Katarina',
  'Kayle', 'Kayn', 'Kennen', 'Kindred', 'LeBlanc', 'Lee Sin', 'Leona', 'Lissandra',
  'Lucian', 'Lulu', 'Lux', 'Lux: Illuminated', 'Malphite', 'Master Yi', 'Miss Fortune',
  'Mordekaiser', 'Morgana', 'Nami', 'Nasus', 'Nautilus', 'Neeko', 'Nidalee',
  'Nilah', 'Nocturne', 'Norra', 'Ornn', 'Pantheon', 'Poppy', 'Pyke', 'Rek\'Sai',
  'Renekton', 'Riven', 'Samira', 'Sejuani', 'Senna', 'Sett', 'Shen', 'Shyvana',
  'Sion', 'Sivir', 'Sona', 'Soraka', 'Swain', 'Tahm Kench', 'Taliyah', 'Taric',
  'Teemo', 'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 'Twisted Fate', 'Twitch',
  'Udyr', 'Varus', 'Vayne', 'Veigar', 'Vex', 'Vi', 'Viego', 'Viktor',
  'Vladimir', 'Volibear', 'Warwick', 'Xerath', 'Xin Zhao', 'Yasuo', 'Yorick',
  'Yuumi', 'Zed', 'Ziggs', 'Zilean', 'Zoe', 'Elder Dragon'
];

/**
 * Generate combined global keywords string
 */
export function getGlobalKeywords(lang = 'vi') {
  const isEn = lang === 'en';
  const primary = isEn ? CORE_KEYWORDS_EN : CORE_KEYWORDS_VI;
  const secondary = isEn ? CORE_KEYWORDS_VI : CORE_KEYWORDS_EN;
  const popularChamps = ['Aurelion Sol', 'Jinx', 'Yasuo', 'Swain', 'Ahri', 'Viego', 'Lux', 'Ambessa', 'Warwick', 'Elder Dragon'];
  const champKeys = popularChamps.map((c) => (isEn ? `${c} PoC guide, ${c} build` : `hướng dẫn ${c} PoC, build ${c}`));
  return [...primary, ...champKeys, ...secondary.slice(0, 10)].join(', ');
}

/**
 * Dynamic keywords for Champion Detail View
 */
export function getChampionKeywords(champ, lang = 'vi') {
  if (!champ) return getGlobalKeywords(lang);
  const isEn = lang === 'en';
  const name = isEn && champ.translations?.en?.name ? champ.translations.en.name : champ.name;
  const viName = champ.name;
  const enName = champ.translations?.en?.name || champ.name;
  const regions = Array.isArray(champ.regions) ? champ.regions.join(', ') : 'Runeterra';
  const stars = champ.maxStar || 3;

  const list = [
    `${name} PoC`,
    `${name} guide`,
    `${name} build`,
    `${name} best relics`,
    `${name} star powers`,
    `${name} constellation`,
    `${name} ${stars} star`,
    `${name} Con Đường Anh Hùng`,
    `hướng dẫn ${viName} PoC`,
    `cổ vật tốt nhất cho ${viName}`,
    `sức mạnh sao ${viName}`,
    `chòm sao ${viName}`,
    `cách build ${viName}`,
    `${enName} LoR Path of Champions`,
    `${regions} PoC champion`,
    'The Path of Champions Guide',
    'Con Đường Anh Hùng LoR'
  ];

  return list.join(', ');
}

/**
 * Dynamic keywords for Relic Detail View
 */
export function getRelicKeywords(relic, lang = 'vi') {
  if (!relic) return getGlobalKeywords(lang);
  const isEn = lang === 'en';
  const name = isEn && relic.translations?.en?.name ? relic.translations.en.name : relic.name;
  const viName = relic.name;
  const enName = relic.translations?.en?.name || relic.name;
  const rarity = relic.rarity || '';

  const list = [
    `${name} relic`,
    `${name} PoC`,
    `cổ vật ${viName}`,
    `cổ vật ${viName} PoC`,
    `${enName} relic guide`,
    `best champions for ${name}`,
    `tướng phù hợp cổ vật ${viName}`,
    `${rarity} relic Path of Champions`,
    'PoC relic list',
    'cổ vật Con Đường Anh Hùng',
    'The Path of Champions Guide'
  ];

  return list.join(', ');
}

/**
 * Dynamic keywords for Power Detail View
 */
export function getPowerKeywords(power, lang = 'vi') {
  if (!power) return getGlobalKeywords(lang);
  const isEn = lang === 'en';
  const name = isEn && power.translations?.en?.name ? power.translations.en.name : power.name;
  const viName = power.name;
  const enName = power.translations?.en?.name || power.name;
  const rarity = power.rarity || '';

  const list = [
    `${name} power`,
    `${name} PoC`,
    `sức mạnh ${viName}`,
    `sức mạnh ${viName} PoC`,
    `${enName} power LoR`,
    `${rarity} power Path of Champions`,
    'PoC power database',
    'sức mạnh sao Con Đường Anh Hùng',
    'The Path of Champions Guide'
  ];

  return list.join(', ');
}

/**
 * Dynamic keywords for Item Detail View
 */
export function getItemKeywords(item, lang = 'vi') {
  if (!item) return getGlobalKeywords(lang);
  const isEn = lang === 'en';
  const name = isEn && item.translations?.en?.name ? item.translations.en.name : item.name;
  const viName = item.name;
  const enName = item.translations?.en?.name || item.name;

  const list = [
    `${name} item`,
    `${name} PoC`,
    `vật phẩm ${viName}`,
    `vật phẩm ${viName} PoC`,
    `${enName} card item LoR`,
    'PoC card items guide',
    'vật phẩm thẻ bài Con Đường Anh Hùng',
    'The Path of Champions Guide'
  ];

  return list.join(', ');
}

/**
 * Dynamic keywords for Card Detail View
 */
export function getCardKeywords(card, lang = 'vi') {
  if (!card) return getGlobalKeywords(lang);
  const isEn = lang === 'en';
  const name = isEn && card.translations?.en?.cardName ? card.translations.en.cardName : (card.cardName || card.name);
  const region = card.region || card.regions?.join(', ') || 'Runeterra';

  const list = [
    `${name} card LoR`,
    `lá bài ${name}`,
    `${name} Legends of Runeterra`,
    `${region} card database`,
    'LoR cards list',
    'lá bài Huyền Thoại Runeterra',
    'The Path of Champions Guide'
  ];

  return list.join(', ');
}

/**
 * Dynamic keywords for Map / Adventure Detail View
 */
export function getMapKeywords(map, lang = 'vi') {
  if (!map) return getGlobalKeywords(lang);
  const isEn = lang === 'en';
  const name = isEn && map.translations?.en?.name ? map.translations.en.name : map.name;
  const stars = map.difficultyStars || map.stars || 3;

  const list = [
    `${name} adventure`,
    `${name} PoC map`,
    `cuộc phiêu lưu ${name}`,
    `bản đồ ${name} PoC`,
    `${stars} star adventure Path of Champions`,
    `${name} boss strategy`,
    'hướng dẫn đánh trùm PoC',
    'The Path of Champions Guide'
  ];

  return list.join(', ');
}

/**
 * Keywords for Tabs
 */
export function getTabKeywords(tab, lang = 'vi') {
  const isEn = lang === 'en';
  switch (tab) {
    case 'tierlist':
      return isEn
        ? 'PoC tier list, champion tier list Path of Champions, best champions PoC 2025, S tier champions LoR, Aurelion Sol S tier, meta rankings LoR PoC'
        : 'bảng xếp hạng tướng PoC, tier list con đường anh hùng, tướng mạnh nhất con đường anh hùng, tướng rank S+ PoC, xếp hạng sức mạnh LoR';
    case 'relics':
      return isEn
        ? 'PoC relics, best relics PoC, epic relics, legendary relics, relic tier list, relic builds, Path of Champions relic database'
        : 'danh sách cổ vật PoC, cổ vật sử thi, cổ vật huyền thoại, cổ vật tốt nhất con đường anh hùng, bảng xếp hạng cổ vật';
    case 'powers':
      return isEn
        ? 'PoC powers, star powers, legendary powers PoC, power database Legends of Runeterra, best powers Path of Champions'
        : 'danh sách sức mạnh PoC, sức mạnh sao, sức mạnh huyền thoại, sức mạnh tốt nhất con đường anh hùng';
    case 'items':
      return isEn
        ? 'PoC card items, item attachments, epic items, rare items, LoR card items database, Path of Champions items'
        : 'vật phẩm thẻ bài PoC, danh sách vật phẩm, trang bị thẻ bài con đường anh hùng';
    case 'cards':
      return isEn
        ? 'LoR cards, Legends of Runeterra card database, card search, champion cards, spell cards, unit cards'
        : 'danh sách lá bài LoR, thư viện thẻ bài Huyền Thoại Runeterra, tra cứu lá bài tướng và phép thuật';
    case 'maps':
      return isEn
        ? 'PoC adventures, world map, nightmare maps, boss guide, Aurelion Sol boss, Lissandra adventure, Swain nightmare'
        : 'cuộc phiêu lưu con đường anh hùng, bản đồ thế giới, bản đồ ác mộng, hướng dẫn diệt boss Lissandra, Swain, Aurelion Sol';
    default:
      return getGlobalKeywords(lang);
  }
}
