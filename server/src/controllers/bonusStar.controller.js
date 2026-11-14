import { bonusStarService } from '../services/bonusStar.service.js';

export const getAllBonusStars = async (req, res, next) => {
  try {
    const { search, q, type, nodeType, limit, fields } = req.query;
    const filter = {
      search: search || q || '',
      type: type || nodeType || '',
      limit: limit || null,
      fields: fields || null
    };

    const data = await bonusStarService.getAll(filter);
    res.status(200).json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getBonusStarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    const item = await bonusStarService.getById(id, fields);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `BonusStar with id "${id}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};
