import app from './app.js';
import { config } from './config/env.js';
import { ensureDatabaseConnected } from './config/dbDataLoader.js';
import './config/redis.js';

if (!process.env.VERCEL) {
  ensureDatabaseConnected().catch((err) => {
    console.warn('⚠️ Server running with fallback data:', err.message);
  });

  app.listen(config.port, () => {
    console.log(`🚀 Server is running on http://localhost:${config.port}`);
    console.log(`📡 API Endpoints base: http://localhost:${config.port}/api/v1`);
  });
}

export default app;
