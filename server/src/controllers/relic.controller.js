import { relicService } from '../services/relic.service.js';

export const getAllRelics = async (req, res, next) => {
  try {
    const { search, q, rarity, type, sort, limit, page, fields } = req.query;
    const filter = {
      search: search || q || '',
      rarity: rarity || '',
      type: type || '',
      sort: sort || '',
      limit: limit || null,
      page: page || null,
      fields: fields || null
    };

    const result = await relicService.getAll(filter);
    res.status(200).json({
      success: true,
      total: result.pagination.total,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const getRelicByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { fields } = req.query;
    const relic = await relicService.getByCode(code, fields);

    if (!relic) {
      return res.status(404).json({
        success: false,
        message: `Relic with code "${code}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: relic
    });
  } catch (error) {
    next(error);
  }
};
