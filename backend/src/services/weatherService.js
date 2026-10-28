import axios from 'axios';
import { prisma } from '../utils/prisma.js';

const DELHI_LAT = 28.6139;
const DELHI_LON = 77.2090;

const WEATHER_VARS = [
  'temperature_2m', 'relativehumidity_2m', 'windspeed_10m',
  'winddirection_10m', 'precipitation', 'surface_pressure',
  'boundary_layer_height',
].join(',');

export async function fetchWeatherForecast(stationId = null) {
  try {
    const resp = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: DELHI_LAT, longitude: DELHI_LON,
        hourly: WEATHER_VARS,
        forecast_days: 4,
        timezone: 'UTC',
      },
      timeout: 15000,
    });

    const h = resp.data.hourly;
    const times = h.time;
    let inserted = 0;

    for (let i = 0; i < times.length; i++) {
      const ts = new Date(times[i] + ':00Z');
      await prisma.weatherObservation.upsert({
        where: {
          latitude_longitude_timestamp: {
            latitude: DELHI_LAT, longitude: DELHI_LON, timestamp: ts,
          },
        },
        update: {
          temperature: h.temperature_2m[i],
          humidity: h.relativehumidity_2m[i],
          windSpeed: h.windspeed_10m[i],
          windDirection: h.winddirection_10m[i],
          precipitation: h.precipitation[i],
          pressure: h.surface_pressure[i],
          boundaryLayerHeight: h.boundary_layer_height?.[i] ?? null,
          source: 'Open-Meteo-Forecast',
          fetchedAt: new Date(),
        },
        create: {
          stationId, latitude: DELHI_LAT, longitude: DELHI_LON,
          timestamp: ts,
          temperature: h.temperature_2m[i],
          humidity: h.relativehumidity_2m[i],
          windSpeed: h.windspeed_10m[i],
          windDirection: h.winddirection_10m[i],
          precipitation: h.precipitation[i],
          pressure: h.surface_pressure[i],
          boundaryLayerHeight: h.boundary_layer_height?.[i] ?? null,
          source: 'Open-Meteo-Forecast',
        },
      });
      inserted++;
    }

    console.log(`[Weather] Forecast: inserted/updated ${inserted} hourly records`);
    return inserted;
  } catch (err) {
    console.error('[Weather] Forecast fetch failed:', err.message);
    throw err;
  }
}

export async function fetchHistoricalWeather(startDate, endDate) {
  try {
    const resp = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
      params: {
        latitude: DELHI_LAT, longitude: DELHI_LON,
        start_date: startDate, end_date: endDate,
        hourly: WEATHER_VARS,
        timezone: 'UTC',
      },
      timeout: 30000,
    });

    const h = resp.data.hourly;
    const times = h.time;
    let inserted = 0;

    for (let i = 0; i < times.length; i++) {
      const ts = new Date(times[i] + ':00Z');
      await prisma.weatherObservation.upsert({
        where: {
          latitude_longitude_timestamp: {
            latitude: DELHI_LAT, longitude: DELHI_LON, timestamp: ts,
          },
        },
        update: {
          temperature: h.temperature_2m[i],
          humidity: h.relativehumidity_2m[i],
          windSpeed: h.windspeed_10m[i],
          windDirection: h.winddirection_10m[i],
          precipitation: h.precipitation[i],
          pressure: h.surface_pressure[i],
          boundaryLayerHeight: h.boundary_layer_height?.[i] ?? null,
          source: 'Open-Meteo-ERA5',
        },
        create: {
          latitude: DELHI_LAT, longitude: DELHI_LON, timestamp: ts,
          temperature: h.temperature_2m[i],
          humidity: h.relativehumidity_2m[i],
          windSpeed: h.windspeed_10m[i],
          windDirection: h.winddirection_10m[i],
          precipitation: h.precipitation[i],
          pressure: h.surface_pressure[i],
          boundaryLayerHeight: h.boundary_layer_height?.[i] ?? null,
          source: 'Open-Meteo-ERA5',
        },
      });
      inserted++;
    }

    console.log(`[Weather] Archive ${startDate}→${endDate}: ${inserted} records`);
    return inserted;
  } catch (err) {
    console.error('[Weather] Archive fetch failed:', err.message);
    throw err;
  }
}
