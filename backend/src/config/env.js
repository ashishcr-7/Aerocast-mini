import dotenv from 'dotenv';
dotenv.config();

const required = ['DATABASE_URL', 'PORT', 'AI_SERVICE_URL', 'FRONTEND_URL', 'ADMIN_TOKEN'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Missing required environment variable: ${key}`);
    if (key === 'DATABASE_URL' || key === 'ADMIN_TOKEN') process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL,
  openaqApiKey: process.env.OPENAQ_API_KEY || null,
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminToken: process.env.ADMIN_TOKEN,
  dataRefreshCron: process.env.DATA_REFRESH_CRON || '0 */6 * * *',
  nodeEnv: process.env.NODE_ENV || 'development',
  openaqEnabled: !!process.env.OPENAQ_API_KEY && process.env.OPENAQ_API_KEY !== 'your_openaq_api_key_here' && process.env.OPENAQ_API_KEY.length > 10,
};

export default config;
