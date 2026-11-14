import { ADMIN_PASSWORD, generateAdminToken, verifyAdminToken } from '../middlewares/auth.middleware.js';
import { getRecentLogs, clearRecentLogs } from '../utils/logger.js';

export const loginAdmin = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || String(password).trim() !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu quản trị viên không chính xác.'
      });
    }

    const token = generateAdminToken();

    res.status(200).json({
      success: true,
      message: 'Đăng nhập quản trị thành công!',
      token,
      user: {
        role: 'admin',
        username: 'Admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyCurrentAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, authenticated: false });
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyAdminToken(token);

    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ success: false, authenticated: false });
    }

    res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        role: 'admin',
        username: 'Admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemLogs = async (req, res, next) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 100);
    const logs = getRecentLogs(limit);
    res.status(200).json({
      success: true,
      total: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSystemLogs = async (req, res, next) => {
  try {
    clearRecentLogs();
    res.status(200).json({
      success: true,
      message: 'Đã xóa toàn bộ nhật ký gần đây.'
    });
  } catch (error) {
    next(error);
  }
};
