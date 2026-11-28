import { imageService } from '../services/image.service.js';

export const imageController = {
  getFolders: async (req, res, next) => {
    try {
      const folders = await imageService.getFolders();
      res.status(200).json({
        success: true,
        data: { folders }
      });
    } catch (err) {
      next(err);
    }
  },

  createFolder: async (req, res, next) => {
    try {
      const { folderName } = req.body;
      const created = await imageService.createFolder(folderName);
      res.status(201).json({
        success: true,
        message: `Đã tạo thư mục "${created}" thành công.`,
        data: { folder: created }
      });
    } catch (err) {
      next(err);
    }
  },

  deleteFolder: async (req, res, next) => {
    try {
      const { folderName } = req.params;
      const result = await imageService.deleteFolder(folderName);
      res.status(200).json({
        success: true,
        message: `Đã xóa thư mục "${folderName}" (${result.deletedCount} tệp).`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  getImages: async (req, res, next) => {
    try {
      const { folder } = req.query;
      const result = await imageService.getImages(folder || '');
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  uploadImages: async (req, res, next) => {
    try {
      const { folder } = req.body;
      const files = req.files;
      const results = await imageService.uploadImages(files, folder);
      res.status(200).json({
        success: true,
        message: `Đã tải lên ${results.length} hình ảnh thành công.`,
        data: { files: results }
      });
    } catch (err) {
      next(err);
    }
  },

  updateSingle: async (req, res, next) => {
    try {
      const { key } = req.body;
      const file = req.file;
      const result = await imageService.updateSingle(file, key);
      res.status(200).json({
        success: true,
        message: 'Đã cập nhật hình ảnh thành công.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  deleteSingle: async (req, res, next) => {
    try {
      const { key } = req.query;
      const result = await imageService.deleteSingle(key);
      res.status(200).json({
        success: true,
        message: 'Đã xóa hình ảnh thành công.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const stats = await imageService.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
};
