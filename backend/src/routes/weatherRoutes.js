import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

const weatherQuerySchema = z.object({
  stationId: z.string().optional(),
  hours: z.coerce.number().int().min(1).max(120).default(48),
});

router.get('/weather', async (req, res) => {
  const parsed = weatherQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid parameters', details: parsed.error.flatten() });
  }

  const { stationId, hours } = parsed.data;
  const cutoff = new Date(Date.now() - hours * 3600_000);

  try {
    let records = [];
    if (stationId) {
      records = await prisma.weatherObservation.findMany({
        where: { stationId, timestamp: { gte: cutoff } },
        orderBy: { timestamp: 'asc' },
        take: hours + 10,
        select: {
          timestamp: true, temperature: true, humidity: true,
          windSpeed: true, windDirection: true, precipitation: true,
          pressure: true, boundaryLayerHeight: true, source: true,
        },
      });
    }

    if (records.length === 0) {
      records = await prisma.weatherObservation.findMany({
        where: { timestamp: { gte: cutoff } },
        orderBy: { timestamp: 'asc' },
        take: hours + 10,
        select: {
          timestamp: true, temperature: true, humidity: true,
          windSpeed: true, windDirection: true, precipitation: true,
          pressure: true, boundaryLayerHeight: true, source: true,
        },
      });
    }

    res.json({ records, count: records.length, source: 'Open-Meteo ERA5 reanalysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
