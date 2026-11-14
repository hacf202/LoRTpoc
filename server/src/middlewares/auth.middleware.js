import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'pocguide_v2_ultra_secret_key_2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Generate HMAC SHA256 Signed Admin Token (Valid for 7 days)
 */
export function generateAdminToken() {
  const payload = {
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify HMAC SHA256 Signed Admin Token
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadB64).digest('base64url');

  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Express Middleware to Protect Admin Routes
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập quản trị viên (Admin token missing).'
    });
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyAdminToken(token);

  if (!payload || payload.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Token quản trị không hợp lệ hoặc đã hết hạn.'
    });
  }

  req.adminUser = payload;
  next();
}

export { ADMIN_PASSWORD };
