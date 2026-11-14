import app from './app.js';
import { config } from './config/env.js';

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 Server is running on http://localhost:${config.port}`);
    console.log(`📡 API Endpoints base: http://localhost:${config.port}/api/v1`);
  });
}

export default app;
