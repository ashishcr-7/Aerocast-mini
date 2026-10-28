import express from 'express';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

router.get('/stations', async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, city: true,
        latitude: true, longitude: true,
        openaqId: true, source: true,
      },
    });
    res.json({ stations, count: stations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
