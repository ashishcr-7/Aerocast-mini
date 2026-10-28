import express from 'express';
import { config } from '../config/env.js';
import { refreshAllData } from '../services/dataRefreshService.js';

const router = express.Router();

// Token auth middleware
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== config.adminToken) {
    return res.status(401).json({ error: 'Unauthorized — valid admin token required' });
  }
  next();
}

let refreshInProgress = false;

router.post('/admin/refresh', requireAdmin, async (req, res) => {
  if (refreshInProgress) {
    return res.status(409).json({ error: 'Refresh already in progress — try again later' });
  }

  refreshInProgress = true;
  res.json({ message: 'Data refresh started', startedAt: new Date().toISOString() });

  try {
    await refreshAllData();
  } catch (err) {
    console.error('[AdminRefresh] Failed:', err.message);
  } finally {
    refreshInProgress = false;
  }
});

export default router;
