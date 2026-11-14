import { itemService } from '../services/item.service.js';

export const itemController = {
  getAll: async (req, res, next) => {
    try {
      const filter = {
        search: req.query.q || req.query.search,
        rarity: req.query.rarity,
        type: req.query.type,
        sort: req.query.sort,
        fields: req.query.fields,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await itemService.getAll(filter);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const item = await itemService.getById(req.params.id, req.query.fields);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
};
