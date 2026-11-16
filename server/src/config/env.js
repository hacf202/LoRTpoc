import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'https://lortpoc.com',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    maxRequests: Number(process.env.RATE_LIMIT_MAX) || 120,
    authMaxRequests: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10
  }
};
