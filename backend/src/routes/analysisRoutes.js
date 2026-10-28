import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Indian CPCB AQI Breakpoints for PM2.5 (24-hour average, µg/m³)
export const PM25_BREAKPOINTS = [
  { low: 0,    high: 30,   iLow: 0,   iHigh: 50,  category: 'Good',        color: '#00e400' },
  { low: 30,   high: 60,   iLow: 51,  iHigh: 100, category: 'Satisfactory',color: '#92d050' },
  { low: 60,   high: 90,   iLow: 101, iHigh: 200, category: 'Moderate',    color: '#ffff00' },
  { low: 90,   high: 120,  iLow: 201, iHigh: 300, category: 'Poor',        color: '#ff7e00' },
  { low: 120,  high: 250,  iLow: 301, iHigh: 400, category: 'Very Poor',   color: '#ff0000' },
  { low: 250,  high: 380,  iLow: 401, iHigh: 500, category: 'Severe',      color: '#7e0023' },
];

export function calculateAQI(concentration, breakpoints = PM25_BREAKPOINTS) {
  if (concentration === null || concentration === undefined || concentration < 0) {
    return null;
  }
  for (const bp of breakpoints) {
    if (concentration >= bp.low && concentration <= bp.high) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.high - bp.low)) * (concentration - bp.low) + bp.iLow;
      return { aqi: Math.round(aqi), category: bp.category, color: bp.color, concentration };
    }
  }
  // Above highest breakpoint
  return { aqi: 500, category: 'Severe', color: '#7e0023', concentration };
}

router.get('/analysis/trapping', async (req, res) => {
  const { stationId } = req.query;
  if (!stationId) return res.status(400).json({ error: 'stationId is required' });

  try {
    // Use 48h window; fall back to latest available if no recent records
    const cutoff48h = new Date(Date.now() - 48 * 3600_000);

    let weather = null;
    if (stationId) {
      weather = await prisma.weatherObservation.findFirst({
        where: { stationId, timestamp: { gte: cutoff48h } },
        orderBy: { timestamp: 'desc' },
      });
    }
    // Fallback 1: any station's recent weather
    if (!weather) {
      weather = await prisma.weatherObservation.findFirst({
        where: { timestamp: { gte: cutoff48h } },
        orderBy: { timestamp: 'desc' },
      });
    }
    // Fallback 2: absolute latest weather record (forecast data)
    if (!weather) {
      weather = await prisma.weatherObservation.findFirst({
        orderBy: { timestamp: 'desc' },
      });
    }

    // PM2.5: try recent 48h first, then fall back to latest available
    let latestPm25 = await prisma.pollutionObservation.findFirst({
      where: { stationId, pollutant: 'pm25', timestamp: { gte: cutoff48h } },
      orderBy: { timestamp: 'desc' },
    });
    if (!latestPm25) {
      latestPm25 = await prisma.pollutionObservation.findFirst({
        where: { stationId, pollutant: 'pm25' },
        orderBy: { timestamp: 'desc' },
      });
    }

    // Trapping risk scoring (documented rule-based, not atmospheric simulation)
    let riskScore = 0;
    let riskFactors = [];
    let dataQuality = 'good';

    if (!weather) {
      dataQuality = 'no_weather_data';
    } else {
      if (weather.windSpeed !== null) {
        if (weather.windSpeed < 5) { riskScore += 3; riskFactors.push('Calm winds (<5 km/h)'); }
        else if (weather.windSpeed < 10) { riskScore += 1; riskFactors.push('Light winds (<10 km/h)'); }
      } else {
        dataQuality = 'partial';
      }

      if (weather.boundaryLayerHeight !== null) {
        if (weather.boundaryLayerHeight < 300) { riskScore += 3; riskFactors.push('Very shallow boundary layer (<300m)'); }
        else if (weather.boundaryLayerHeight < 600) { riskScore += 2; riskFactors.push('Shallow boundary layer (<600m)'); }
        else if (weather.boundaryLayerHeight < 1000) { riskScore += 1; riskFactors.push('Moderate boundary layer (<1000m)'); }
      } else {
        dataQuality = 'partial';
        riskFactors.push('Boundary layer height data unavailable');
      }

      if (weather.humidity !== null && weather.humidity > 80) {
        riskScore += 1;
        riskFactors.push('High humidity (>80%) — hygroscopic growth likely');
      }
    }

    const riskLevel = riskScore >= 6 ? 'extreme' : riskScore >= 5 ? 'high' : riskScore >= 3 ? 'moderate' : 'low';

    const aqiResult = latestPm25 ? calculateAQI(latestPm25.value, PM25_BREAKPOINTS) : null;

    res.json({
      stationId,
      timestamp: new Date().toISOString(),
      disclaimer: 'This is a rule-based risk indicator using available weather variables. It is NOT an atmospheric inversion detection or validated meteorological simulation.',
      trappingRisk: {
        level: riskLevel,
        score: riskScore,
        maxScore: 7,
        factors: riskFactors,
        dataQuality,
      },
      weather: weather ? {
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        boundaryLayerHeight: weather.boundaryLayerHeight,
        humidity: weather.humidity,
        temperature: weather.temperature,
        timestamp: weather.timestamp,
        source: weather.source,
      } : null,
      currentAqi: aqiResult,
      latestPm25: latestPm25 ? { value: latestPm25.value, unit: latestPm25.unit, timestamp: latestPm25.timestamp } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
