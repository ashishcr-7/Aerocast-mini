import { prisma } from '../utils/prisma.js';
import { seedStations, fetchRecentObservations, DELHI_STATIONS } from './airQualityService.js';
import { fetchWeatherForecast } from './weatherService.js';

async function withLog(source, fn) {
  const log = await prisma.dataRefreshLog.create({
    data: { source, status: 'running', startedAt: new Date() },
  });

  let inserted = 0;
  try {
    inserted = await fn();
    await prisma.dataRefreshLog.update({
      where: { id: log.id },
      data: { status: 'success', completedAt: new Date(), recordsInserted: inserted },
    });
  } catch (err) {
    await prisma.dataRefreshLog.update({
      where: { id: log.id },
      data: {
        status: 'failed', completedAt: new Date(),
        errorSummary: err.message.slice(0, 500),
      },
    });
    throw err;
  }
}

export async function refreshAllData() {
  console.log('[Refresh] Starting full data refresh...');

  // Ensure stations exist
  await seedStations();

  // Refresh weather forecast
  try {
    await withLog('open-meteo-forecast', () => fetchWeatherForecast());
  } catch (err) {
    console.error('[Refresh] Weather forecast failed:', err.message);
  }

  // Refresh air quality observations (if API key available)
  try {
    await withLog('openaq', async () => {
      const stations = await prisma.station.findMany({ where: { isActive: true } });
      let total = 0;
      for (const station of stations) {
        if (!station.openaqId) continue;
        try {
          const count = await fetchRecentObservations(station.openaqId, station.id, 48);
          total += count;
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error(`[Refresh] Station ${station.name} failed:`, err.message);
        }
      }
      return total;
    });
  } catch (err) {
    console.error('[Refresh] OpenAQ refresh failed:', err.message);
  }

  console.log('[Refresh] Data refresh complete');
}
