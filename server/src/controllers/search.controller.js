import { searchService } from '../services/search.service.js';

export const searchController = {
  omniSearch: (req, res, next) => {
    try {
      const q = req.query.q || req.query.query || req.query.search || '';
      const limitPerCategory = req.query.limit || 12;
      const result = searchService.omniSearch(q, { limitPerCategory });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
};
