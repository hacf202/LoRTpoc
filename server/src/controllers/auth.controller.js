import { ADMIN_PASSWORD, generateAdminToken, verifyAdminToken } from '../middlewares/auth.middleware.js';
import { querySystemLogs, clearAllSystemLogs, recordLog } from '../services/systemLog.service.js';
import { getClientIp } from '../middlewares/rateLimit.middleware.js';

export const loginAdmin = async (req, res, next) => {
  try {
    const { password } = req.body;
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    if (!password || String(password).trim() !== ADMIN_PASSWORD) {
      recordLog({
        key: 'auth:login:failed',
        level: 'warn',
        category: 'auth',
        message: `Admin login failed from IP ${clientIp}`,
        value: { ip: clientIp, userAgent, attemptedAt: new Date().toISOString() }
      });

      return res.status(401).json({
        success: false,
        message: 'Mật khẩu quản trị viên không chính xác.'
      });
    }

    const token = generateAdminToken();

    recordLog({
      key: 'auth:login:success',
      level: 'info',
      category: 'auth',
      message: `Admin logged in successfully from IP ${clientIp}`,
      value: { ip: clientIp, userAgent, loggedInAt: new Date().toISOString() }
    });

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
    const { key, level, category, search, limit, page } = req.query;
    const result = await querySystemLogs({ key, level, category, search, limit, page });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSystemLogs = async (req, res, next) => {
  try {
    await clearAllSystemLogs();
    res.status(200).json({
      success: true,
      message: 'Đã xóa toàn bộ nhật ký máy chủ.'
    });
  } catch (error) {
    next(error);
  }
};
