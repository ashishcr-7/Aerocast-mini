import express from 'express';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/env.js';
import axios from 'axios';

const router = express.Router();

router.get('/health', async (req, res) => {
  const checks = { status: 'ok', timestamp: new Date().toISOString(), services: {} };

  // PostgreSQL check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = { status: 'ok' };
  } catch (err) {
    checks.services.database = { status: 'error', message: err.message };
    checks.status = 'degraded';
  }

  // AI Service check
  try {
    const resp = await axios.get(`${config.aiServiceUrl}/health`, { timeout: 3000 });
    checks.services.aiService = { status: 'ok', version: resp.data.version };
  } catch {
    checks.services.aiService = { status: 'unavailable', message: 'FastAPI not reachable' };
    checks.status = 'degraded';
  }

  // OpenAQ key presence
  checks.services.openaq = {
    status: config.openaqEnabled ? 'configured' : 'no_key',
    note: config.openaqEnabled ? 'API key present' : 'No OPENAQ_API_KEY — live observations disabled',
  };

  const httpStatus = checks.status === 'ok' ? 200 : 207;
  res.status(httpStatus).json(checks);
});

// Data freshness status
router.get('/data/status', async (req, res) => {
  try {
    const logs = await prisma.dataRefreshLog.findMany({
      orderBy: { startedAt: 'desc' },
      distinct: ['source'],
      take: 10,
    });

    const stationCount = await prisma.station.count();
    const observationCount = await prisma.pollutionObservation.count();
    const weatherCount = await prisma.weatherObservation.count();

    res.json({
      sources: logs,
      counts: { stations: stationCount, observations: observationCount, weather: weatherCount },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
