import app from './app.js';
import { config } from './config/env.js';
import { ensureDatabaseConnected } from './config/dbDataLoader.js';
import './config/redis.js';

// Khởi chạy kết nối và nạp dữ liệu từ MongoDB cho cả môi trường Local lẫn Serverless
ensureDatabaseConnected().catch((err) => {
  console.warn('⚠️ Server running with fallback data:', err.message);
});

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 Server is running on http://localhost:${config.port}`);
    console.log(`📡 API Endpoints base: http://localhost:${config.port}/api/v1`);
  });
}

export default app;
