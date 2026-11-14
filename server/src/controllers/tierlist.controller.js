import { championService } from '../services/champion.service.js';

export const getTierList = async (req, res, next) => {
  try {
    const result = await championService.getAll({ limit: 'all' });
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
      
      if (rawTier.startsWith('S+')) {
        tiers['S+'].push(champ);
      } else if (rawTier.startsWith('S')) {
        tiers['S'].push(champ);
      } else if (rawTier.startsWith('A+')) {
        tiers['A+'].push(champ);
      } else if (rawTier.startsWith('A')) {
        tiers['A'].push(champ);
      } else if (rawTier.startsWith('B+')) {
        tiers['B+'].push(champ);
      } else if (rawTier.startsWith('B')) {
        tiers['B'].push(champ);
      } else if (rawTier.startsWith('C')) {
        tiers['C'].push(champ);
      } else if (rawTier.startsWith('D')) {
        tiers['D'].push(champ);
      } else {
        tiers['UNRANKED'].push(champ);
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