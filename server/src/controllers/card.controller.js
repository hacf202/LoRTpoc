import { cardService } from '../services/card.service.js';

export const getAllCards = async (req, res, next) => {
  try {
    const { search, q, region, rarity, cost, type, sort, codes, page, limit, fields, includeVariants } = req.query;
    const filter = {
      search: search || q || '',
      region: region || '',
      rarity: rarity || '',
      cost: cost ?? null,
      type: type || '',
      sort: sort || '',
      codes: codes || '',
      page: page || null,
      limit: limit || null,
      fields: fields || null,
      includeVariants: includeVariants !== undefined ? (includeVariants === 'true' || includeVariants === true) : undefined
    };

    const result = await cardService.getAll(filter);
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

export const getCardByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { fields } = req.query;
    const card = await cardService.getByCode(code, fields);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: `Card with code "${code}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    next(error);
  }
};
