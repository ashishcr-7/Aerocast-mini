import app from './app.js';
import { config } from './config/env.js';
import { prisma } from './utils/prisma.js';
import { startDataRefreshJob } from './jobs/dataRefreshJob.js';

const PORT = config.port;

async function main() {
  // Verify DB connection
  try {
    await prisma.$connect();
    console.log('[Server] ✅ Database connected');
  } catch (err) {
    console.error('[Server] ❌ Database connection failed:', err.message);
    process.exit(1);
  }

  // Start scheduled jobs
  startDataRefreshJob();

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`[Server] ✅ Express running on http://localhost:${PORT}`);
    console.log(`[Server]    Environment: ${config.nodeEnv}`);
    console.log(`[Server]    OpenAQ: ${config.openaqEnabled ? '✅ Key configured' : '⚠️  No API key — observations disabled'}`);
    console.log(`[Server]    AI Service: ${config.aiServiceUrl}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[Server] Disconnected from DB. Bye!');
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
