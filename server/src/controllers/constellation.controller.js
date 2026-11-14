import { constellationService } from '../services/constellation.service.js';

export const getAllConstellations = async (req, res, next) => {
  try {
    const { search, q, limit, fields } = req.query;
    const filter = {
      search: search || q || '',
      limit: limit || null,
      fields: fields || null
    };

    const data = await constellationService.getAll(filter);
    res.status(200).json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getConstellationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    const constellation = await constellationService.getById(id, fields);

    if (!constellation) {
      return res.status(404).json({
        success: false,
        message: `Constellation for champion "${id}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: constellation
    });
  } catch (error) {
    next(error);
  }
};