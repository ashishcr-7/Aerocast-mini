/**
 * clear-forecast-cache.js
 * Deletes stale forecast records older than 1 hour and triggers fresh forecasts for all stations.
 */
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const AI_SERVICE = 'http://127.0.0.1:8000';

async function main() {
  // Delete forecasts older than 1 hour
  const cutoff = new Date(Date.now() - 60 * 60000);
  const deleted = await prisma.forecast.deleteMany({
    where: { issuedAt: { lt: cutoff } },
  });
  console.log(`[Cache] Deleted ${deleted.count} stale forecast records`);

  // Get all stations
  const stations = await prisma.station.findMany();
  console.log(`[Forecast] Generating fresh 72h forecasts for ${stations.length} stations...`);

  const now = new Date();

  for (const station of stations) {
    try {
      // Get latest PM2.5 observations (most recent 72 hours)
      const recentObs = await prisma.pollutionObservation.findMany({
        where: { stationId: station.id, pollutant: 'pm25' },
        orderBy: { timestamp: 'asc' },
        take: 72,
      });

      // Get weather data (past 48h + next 72h)
      const weatherObs = await prisma.weatherObservation.findMany({
        where: {
          timestamp: {
            gte: new Date(now.getTime() - 48 * 3600_000),
            lte: new Date(now.getTime() + 72 * 3600_000),
          },
        },
        orderBy: { timestamp: 'asc' },
        take: 120,
      });

      const resp = await axios.post(`${AI_SERVICE}/predict`, {
        station_id: station.id,
        station_name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        forecast_hours: 72,
        issued_at: now.toISOString(),
        recent_pm25: recentObs.map(o => ({
          timestamp: o.timestamp.toISOString(),
          value: o.value,
        })),
        weather_data: weatherObs.map(w => ({
          timestamp: w.timestamp.toISOString(),
          temperature: w.temperature,
          humidity: w.humidity,
          wind_speed: w.windSpeed,
          wind_direction: w.windDirection,
          precipitation: w.precipitation,
          pressure: w.pressure,
          boundary_layer_height: w.boundaryLayerHeight,
        })),
      }, { timeout: 30000 });

      const { forecasts, model_version, issued_at } = resp.data;

      for (const f of forecasts) {
        await prisma.forecast.upsert({
          where: {
            stationId_issuedAt_forecastTime_pollutant_modelVersion: {
              stationId: station.id,
              issuedAt: new Date(issued_at),
              forecastTime: new Date(f.forecast_time),
              pollutant: 'pm25',
              modelVersion: model_version,
            },
          },
          update: { predictedValue: f.predicted_pm25, dataQuality: f.data_quality || 'ok' },
          create: {
            stationId: station.id,
            issuedAt: new Date(issued_at),
            forecastTime: new Date(f.forecast_time),
            leadHours: f.lead_hours,
            pollutant: 'pm25',
            predictedValue: f.predicted_pm25,
            unit: 'µg/m³',
            modelVersion: model_version,
            dataQuality: f.data_quality || 'ok',
          },
        });
      }

      console.log(`[Forecast] ✅ ${station.name}: ${forecasts.length} forecasts saved (model: ${model_version})`);
    } catch (err) {
      console.error(`[Forecast] ❌ ${station.name}: ${err.message}`);
    }
  }

  await prisma.$disconnect();
  console.log('\n[Done] Fresh forecasts generated for all stations.');
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
