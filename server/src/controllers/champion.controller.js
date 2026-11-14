import { championService } from '../services/champion.service.js';

export const getAllChampions = async (req, res, next) => {
  try {
    // Whitelist only safe filter parameters to prevent sensitive data leaks or injections
    const {
      search, q,
      region, regions,
      stars, maxStar,
      tier, tiers,
      cost, costs,
      tag, tags,
      sort, page, limit,
      fields, summary
    } = req.query;

    const filter = {
      search: search || q || '',
      regions: regions || region || null,
      stars: stars || maxStar || null,
      tier: tiers || tier || null,
      costs: costs || cost || null,
      tags: tags || tag || null,
      sort: sort || null,
      page: page || null,
      limit: limit || null,
      fields: fields || null,
      summary: summary || null
    };

    const result = await championService.getAll(filter);
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

export const getChampionFilters = async (req, res, next) => {
  try {
    const filters = await championService.getFilterOptions();
    res.status(200).json({
      success: true,
      data: filters
    });
  } catch (error) {
    next(error);
  }
};

export const getChampionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    const champion = await championService.getById(id, fields);

    if (!champion) {
      return res.status(404).json({
        success: false,
        message: `Champion with ID "${id}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: champion
    });
  } catch (error) {
    next(error);
  }
};

export const createChampion = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Field "name" is required and cannot be empty'
      });
    }

    const created = await championService.create(req.body);
    res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    next(error);
  }
};

export const updateChampion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await championService.update(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Champion with ID "${id}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChampion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await championService.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Champion with ID "${id}" not found`
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
