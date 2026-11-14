import { mapService } from '../services/map.service.js';

export const getAllMaps = async (req, res, next) => {
  try {
    const { search, q, type, difficulty, sort, page, limit, fields } = req.query;
    const filter = {
      search: search || q || '',
      type: type || '',
      difficulty: difficulty || null,
      sort: sort || '',
      page: page || null,
      limit: limit || null,
      fields: fields || null
    };

    const result = await mapService.getAll(filter);
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

export const getMapById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    const map = await mapService.getById(id, fields);

    if (!map) {
      return res.status(404).json({
        success: false,
        message: `Adventure map with ID "${id}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
};