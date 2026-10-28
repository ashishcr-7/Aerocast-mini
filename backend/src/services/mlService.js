import axios from 'axios';
import { config } from '../config/env.js';
import { prisma } from '../utils/prisma.js';

const AI = config.aiServiceUrl;

export const mlService = {
  async generateForecast(stationId, hours = 72) {
    // Get latest observations for the station
    const recentObs = await prisma.pollutionObservation.findMany({
      where: { stationId, pollutant: 'pm25' },
      orderBy: { timestamp: 'desc' },
      take: 72,
    });

    // Get recent + upcoming weather
    const now = new Date();
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

    const station = await prisma.station.findUnique({ where: { id: stationId } });
    if (!station) throw new Error(`Station ${stationId} not found`);

    const resp = await axios.post(`${AI}/predict`, {
      station_id: stationId,
      station_name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
      forecast_hours: hours,
      issued_at: now.toISOString(),
      recent_pm25: recentObs.reverse().map(o => ({
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

    // Persist forecasts to DB
    for (const f of forecasts) {
      await prisma.forecast.upsert({
        where: {
          stationId_issuedAt_forecastTime_pollutant_modelVersion: {
            stationId, issuedAt: new Date(issued_at),
            forecastTime: new Date(f.forecast_time),
            pollutant: 'pm25', modelVersion: model_version,
          },
        },
        update: { predictedValue: f.predicted_pm25, dataQuality: f.data_quality || 'ok' },
        create: {
          stationId, issuedAt: new Date(issued_at),
          forecastTime: new Date(f.forecast_time),
          leadHours: f.lead_hours, pollutant: 'pm25',
          predictedValue: f.predicted_pm25, unit: 'µg/m³',
          modelVersion: model_version,
          dataQuality: f.data_quality || 'ok',
        },
      });
    }

    return { stationId, issuedAt: issued_at, source: 'fresh', forecasts, modelVersion: model_version };
  },

  async getMetrics() {
    const resp = await axios.get(`${AI}/metrics`, { timeout: 10000 });
    return resp.data;
  },
};
