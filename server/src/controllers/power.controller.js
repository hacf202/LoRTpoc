import { powerService } from '../services/power.service.js';

export const getAllPowers = async (req, res, next) => {
  try {
    const { search, q, rarity, type, sort, codes, page, limit, fields } = req.query;
    const filter = {
      search: search || q || '',
      rarity: rarity || '',
      type: type || '',
      sort: sort || '',
      codes: codes || '',
      page: page || null,
      limit: limit || null,
      fields: fields || null
    };

    const result = await powerService.getAll(filter);
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

export const getPowerByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { fields } = req.query;
    const power = await powerService.getByCode(code, fields);

    if (!power) {
      return res.status(404).json({
        success: false,
        message: `Power with code "${code}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: power
    });
  } catch (error) {
    next(error);
  }
};