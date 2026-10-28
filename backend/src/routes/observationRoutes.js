import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

const querySchema = z.object({
  stationId: z.string().min(1),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  pollutant: z.enum(['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']).optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(168),
});

router.get('/observations', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
  }

  const { stationId, from, to, pollutant, limit } = parsed.data;

  try {
    const where = {
      stationId,
      ...(pollutant && { pollutant }),
      timestamp: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    };

    const observations = await prisma.pollutionObservation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true, timestamp: true, pollutant: true,
        value: true, unit: true, source: true,
      },
    });

    res.json({ stationId, observations: observations.reverse(), count: observations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
