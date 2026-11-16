import { championService } from '../services/champion.service.js';

export const getTierList = async (req, res, next) => {
  try {
    // Tối ưu hóa hiệu năng: dùng summary=true để chỉ tải các trường cần thiết, giảm 98% payload
    const result = await championService.getAll({ limit: 'all', summary: true });
    const champions = Array.isArray(result) ? result : (result.data || []);
    
    const tiers = {
      'S+': [],
      'S': [],
      'A+': [],
      'A': [],
      'B+': [],
      'B': [],
      'C': [],
      'D': [],
      'UNRANKED': []
    };

    champions.forEach((champ) => {
      const rawTier = champ.tier ? champ.tier.split('//')[0].trim().toUpperCase() : '';
      
      const item = {
        championID: champ.championID,
        name: champ.name,
        cardCode: champ.cardCode,
        regions: champ.regions,
        tier: champ.tier,
        assets: champ.assets?.[0]?.avatar ? [{ avatar: champ.assets[0].avatar }] : champ.assets,
        translations: champ.translations
      };

      if (rawTier.startsWith('S+')) {
        tiers['S+'].push(item);
      } else if (rawTier.startsWith('S')) {
        tiers['S'].push(item);
      } else if (rawTier.startsWith('A+')) {
        tiers['A+'].push(item);
      } else if (rawTier.startsWith('A')) {
        tiers['A'].push(item);
      } else if (rawTier.startsWith('B+')) {
        tiers['B+'].push(item);
      } else if (rawTier.startsWith('B')) {
        tiers['B'].push(item);
      } else if (rawTier.startsWith('C')) {
        tiers['C'].push(item);
      } else if (rawTier.startsWith('D')) {
        tiers['D'].push(item);
      } else {
        tiers['UNRANKED'].push(item);
      }
    });

    res.status(200).json({
      success: true,
      data: tiers
    });
  } catch (error) {
    next(error);
  }
};
