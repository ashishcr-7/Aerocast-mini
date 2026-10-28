import axios from 'axios';
import { config } from '../config/env.js';
import { prisma } from '../utils/prisma.js';

const OPENAQ_BASE = 'https://api.openaq.org/v3';

// Delhi NCR stations — seeded from OpenAQ with known IDs for major monitoring stations
export const DELHI_STATIONS = [
  { name: 'Anand Vihar',       lat: 28.6469, lon: 77.3162, openaqId: '8118'  },
  { name: 'Punjabi Bagh',      lat: 28.6635, lon: 77.1315, openaqId: '8122'  },
  { name: 'RK Puram',          lat: 28.5640, lon: 77.1740, openaqId: '8127'  },
  { name: 'ITO',                lat: 28.6289, lon: 77.2406, openaqId: '8119'  },
  { name: 'Mandir Marg',       lat: 28.6363, lon: 77.2010, openaqId: '8121'  },
  { name: 'Lodhi Road',        lat: 28.5918, lon: 77.2279, openaqId: '8120'  },
  { name: 'Dwarka Sec 8',      lat: 28.5785, lon: 77.0547, openaqId: '8117'  },
  { name: 'Rohini',            lat: 28.7330, lon: 77.1170, openaqId: '8126'  },
  { name: 'Gurugram Sector 51',lat: 28.4497, lon: 77.0997, openaqId: '64723' },
  { name: 'Noida Sector 62',   lat: 28.6269, lon: 77.3626, openaqId: '64724' },
];

export async function seedStations() {
  console.log('[OpenAQ] Seeding Delhi NCR stations...');
  for (const s of DELHI_STATIONS) {
    await prisma.station.upsert({
      where: { openaqId: s.openaqId },
      update: { latitude: s.lat, longitude: s.lon, name: s.name },
      create: {
        name: s.name, city: 'Delhi NCR',
        latitude: s.lat, longitude: s.lon,
        openaqId: s.openaqId, source: 'OpenAQ',
      },
    });
  }
  console.log(`[OpenAQ] Seeded ${DELHI_STATIONS.length} stations`);
}

export async function fetchRecentObservations(stationOpenaqId, dbStationId, hoursBack = 48) {
  if (!config.openaqEnabled) {
    console.warn('[OpenAQ] Skipped — no API key configured');
    return 0;
  }

  const dateFrom = new Date(Date.now() - hoursBack * 3600_000).toISOString();

  try {
    // Get sensors for this location
    const sensorsResp = await axios.get(
      `${OPENAQ_BASE}/locations/${stationOpenaqId}/sensors`,
      { headers: { 'X-API-Key': config.openaqApiKey }, timeout: 10000 }
    );

    const sensors = sensorsResp.data?.results || [];
    // Pick the PM2.5 sensor that has the most recent reporting timestamp
    const pm25Sensors = sensors.filter(s =>
      s.parameter?.name?.toLowerCase() === 'pm25' ||
      s.parameter?.displayName?.toLowerCase().includes('pm2.5')
    );
    pm25Sensors.sort((a, b) => {
      const tA = new Date(a.datetimeLast?.utc || 0).getTime();
      const tB = new Date(b.datetimeLast?.utc || 0).getTime();
      return tB - tA;
    });
    const pm25Sensor = pm25Sensors[0];

    if (!pm25Sensor) {
      console.warn(`[OpenAQ] No PM2.5 sensor found at location ${stationOpenaqId}`);
      return 0;
    }

    let inserted = 0;

    // 1. Fetch exact latest real-time measurement for this location
    try {
      const latestResp = await axios.get(
        `${OPENAQ_BASE}/locations/${stationOpenaqId}/latest`,
        { headers: { 'X-API-Key': config.openaqApiKey }, timeout: 10000 }
      );
      const latestResults = latestResp.data?.results || [];
      // Match the exact active PM2.5 sensor ID
      const latestPm25 = latestResults.find(r => r.sensorsId === pm25Sensor.id);

      if (latestPm25 && latestPm25.value !== null && latestPm25.value >= 0) {
        const ts = new Date(latestPm25.datetime?.utc || latestPm25.datetime?.local);
        if (!isNaN(ts.getTime())) {
          await prisma.pollutionObservation.upsert({
            where: {
              stationId_timestamp_pollutant: {
                stationId: dbStationId, timestamp: ts, pollutant: 'pm25',
              },
            },
            update: { value: latestPm25.value, fetchedAt: new Date(), source: 'OpenAQ-Live' },
            create: {
              stationId: dbStationId, timestamp: ts,
              pollutant: 'pm25', value: latestPm25.value, unit: 'µg/m³',
              source: 'OpenAQ-Live', fetchedAt: new Date(),
            },
          });
          inserted++;
          console.log(`[OpenAQ] ${stationOpenaqId}: Saved latest live PM2.5 = ${latestPm25.value} µg/m³`);
        }
      }
    } catch (latestErr) {
      console.warn(`[OpenAQ] Could not fetch latest for ${stationOpenaqId}:`, latestErr.message);
    }

    // 2. Fetch recent hourly measurements
    try {
      const measResp = await axios.get(
        `${OPENAQ_BASE}/sensors/${pm25Sensor.id}/measurements/hourly`,
        {
          params: { date_from: dateFrom, limit: 50 },
          headers: { 'X-API-Key': config.openaqApiKey },
          timeout: 10000,
        }
      );

      const measurements = measResp.data?.results || [];
      for (const m of measurements) {
        const value = m.value?.average ?? m.value;
        if (value === null || value === undefined || value < 0) continue;

        const ts = new Date(m.period?.datetimeTo?.utc || m.datetime?.utc || m.date?.utc);
        if (isNaN(ts.getTime())) continue;

        await prisma.pollutionObservation.upsert({
          where: {
            stationId_timestamp_pollutant: {
              stationId: dbStationId, timestamp: ts, pollutant: 'pm25',
            },
          },
          update: { value, fetchedAt: new Date() },
          create: {
            stationId: dbStationId, timestamp: ts,
            pollutant: 'pm25', value, unit: 'µg/m³',
            source: 'OpenAQ', fetchedAt: new Date(),
          },
        });
        inserted++;
      }
    } catch (hourlyErr) {
      console.warn(`[OpenAQ] Hourly history skipped for ${stationOpenaqId} (${hourlyErr.message})`);
    }

    console.log(`[OpenAQ] ${stationOpenaqId}: total ${inserted} PM2.5 observations processed`);
    return inserted;
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('[OpenAQ] Rate limited — will retry later');
      throw Object.assign(new Error('Rate limited'), { retryable: true });
    }
    console.error(`[OpenAQ] Error fetching ${stationOpenaqId}:`, err.message);
    return 0;
  }
}
