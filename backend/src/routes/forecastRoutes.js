import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { mlService } from '../services/mlService.js';
import { config } from '../config/env.js';

const router = express.Router();

const forecastQuerySchema = z.object({
  stationId: z.string().min(1),
  hours: z.coerce.number().int().min(1).max(72).default(72),
});

router.get('/forecast', async (req, res) => {
  const parsed = forecastQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid parameters', details: parsed.error.flatten() });
  }

  const { stationId, hours } = parsed.data;

  try {
    // Try to get cached forecasts from DB first (most recent batch issued in last 6h)
    const cutoff = new Date(Date.now() - 6 * 3600_000);
    const latestIssued = await prisma.forecast.findFirst({
      where: {
        stationId,
        issuedAt: { gte: cutoff },
      },
      orderBy: { issuedAt: 'desc' },
      select: { issuedAt: true },
    });

    if (latestIssued) {
      const cached = await prisma.forecast.findMany({
        where: {
          stationId,
          issuedAt: latestIssued.issuedAt,
          leadHours: { lte: hours },
        },
        orderBy: { leadHours: 'asc' },
      });

      if (cached.length >= hours * 0.8) {
        return res.json({
          stationId,
          issuedAt: latestIssued.issuedAt,
          source: 'cache',
          forecasts: cached,
          modelVersion: cached[0]?.modelVersion,
        });
      }
    }

    // Generate fresh forecast via AI service
    const freshForecast = await mlService.generateForecast(stationId, hours);
    return res.json(freshForecast);
  } catch (err) {
    console.warn(`[Forecast] Fresh prediction fallback for station ${stationId}:`, err.message);

    // Return graceful degradation with last available forecast if any
    const lastForecast = await prisma.forecast.findFirst({
      where: { stationId, pollutant: 'pm25' },
      orderBy: { issuedAt: 'desc' },
    });

    if (lastForecast) {
      const cachedForecasts = await prisma.forecast.findMany({
        where: {
          stationId,
          issuedAt: lastForecast.issuedAt,
          leadHours: { lte: hours },
        },
        orderBy: { forecastTime: 'asc' },
      });

      if (cachedForecasts.length > 0) {
        return res.json({
          stationId,
          issuedAt: lastForecast.issuedAt,
          source: 'cache_fallback',
          stale: true,
          warning: 'Live AI inference fallback: returning latest available station forecasts',
          forecasts: cachedForecasts,
          modelVersion: lastForecast.modelVersion,
        });
      }
    }

    res.status(503).json({
      error: 'Forecast unavailable',
      detail: err.message,
      suggestion: 'Ensure the AI service is running and the model is trained',
    });
  }
});

export default router;
