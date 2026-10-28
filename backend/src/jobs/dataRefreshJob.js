import cron from 'node-cron';
import { config } from '../config/env.js';
import { refreshAllData } from '../services/dataRefreshService.js';

let isRunning = false;

export function startDataRefreshJob() {
  const schedule = config.dataRefreshCron;
  console.log(`[Cron] Scheduling data refresh: "${schedule}"`);

  cron.schedule(schedule, async () => {
    if (isRunning) {
      console.log('[Cron] Skipping — previous refresh still running');
      return;
    }
    isRunning = true;
    console.log(`[Cron] Starting scheduled refresh at ${new Date().toISOString()}`);
    try {
      await refreshAllData();
    } catch (err) {
      console.error('[Cron] Refresh failed:', err.message);
    } finally {
      isRunning = false;
    }
  });

  // Run once shortly after startup (delayed 10s to let DB settle)
  setTimeout(async () => {
    if (isRunning) return;
    isRunning = true;
    console.log('[Cron] Running initial refresh on startup...');
    try {
      await refreshAllData();
    } catch (err) {
      console.error('[Cron] Initial refresh failed:', err.message);
    } finally {
      isRunning = false;
    }
  }, 10000);
}
