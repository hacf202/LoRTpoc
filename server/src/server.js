import app from './app.js';
import { config } from './config/env.js';
import { ensureDatabaseConnected } from './config/dbDataLoader.js';
import { recordLog } from './services/systemLog.service.js';
import './config/redis.js';

// Catch uncaught exceptions to prevent silent crashes and preserve error context in system_logs
process.on('uncaughtException', (err) => {
  console.error('🔥 [FATAL] Uncaught Exception:', err);
  recordLog({
    key: `system:crash:uncaughtException:${err.name || 'Error'}`,
    level: 'error',
    category: 'system',
    message: `Fatal Uncaught Exception: ${err.message}`,
    value: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  });
});

// Catch unhandled asynchronous promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [FATAL] Unhandled Promise Rejection:', reason);
  recordLog({
    key: 'system:crash:unhandledRejection',
    level: 'error',
    category: 'system',
    message: `Unhandled Promise Rejection: ${reason?.message || String(reason)}`,
    value: {
      reason: reason?.message || String(reason),
      stack: reason?.stack || null
    }
  });
});

// Graceful shutdown listener (Render container cycling / SIGTERM)
process.on('SIGTERM', () => {
  console.log('🛑 [SIGTERM] Server receiving termination signal...');
  recordLog({
    key: 'system:lifecycle:sigterm',
    level: 'info',
    category: 'system',
    message: 'Render container receiving SIGTERM - graceful shutdown triggered',
    value: { uptime: process.uptime(), timestamp: new Date().toISOString() }
  });
});

// Khởi chạy kết nối và nạp dữ liệu từ MongoDB cho cả môi trường Local lẫn Serverless
ensureDatabaseConnected()
  .then(() => {
    recordLog({
      key: 'system:lifecycle:startup_ready',
      level: 'info',
      category: 'system',
      message: 'Server datasets loaded and ready',
      value: { port: config.port, uptime: process.uptime(), nodeVersion: process.version }
    });
  })
  .catch((err) => {
    console.warn('⚠️ Server running with fallback data:', err.message);
    recordLog({
      key: 'system:lifecycle:startup_fallback',
      level: 'warn',
      category: 'system',
      message: `Database sync failed, fallback active: ${err.message}`,
      value: { error: err.message, stack: err.stack }
    });
  });

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 Server is running on http://localhost:${config.port}`);
    console.log(`📡 API Endpoints base: http://localhost:${config.port}/api/v1`);
  });
}

export default app;
