import express from 'express';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

router.get('/model/metrics', async (req, res) => {
  try {
    const metrics = await prisma.modelEvaluation.findMany({
      orderBy: [{ modelName: 'asc' }, { leadHours: 'asc' }],
    });

    // Group by model
    const grouped = {};
    for (const m of metrics) {
      if (!grouped[m.modelName]) grouped[m.modelName] = { modelName: m.modelName, pollutant: m.pollutant, trainingPeriod: m.trainingPeriod, testPeriod: m.testPeriod, horizons: [] };
      grouped[m.modelName].horizons.push({ leadHours: m.leadHours, mae: m.mae, rmse: m.rmse, r2: m.r2 });
    }

    res.json({ models: Object.values(grouped), count: metrics.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
