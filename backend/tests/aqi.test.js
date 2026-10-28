import { describe, it, expect } from '@jest/globals';
import { calculateAQI, PM25_BREAKPOINTS } from '../src/routes/analysisRoutes.js';

describe('Indian CPCB AQI Calculation for PM2.5', () => {
  it('should return null for invalid concentrations', () => {
    expect(calculateAQI(null)).toBeNull();
    expect(calculateAQI(undefined)).toBeNull();
    expect(calculateAQI(-5)).toBeNull();
  });

  it('should correctly classify Good category (0-30 µg/m³ -> AQI 0-50)', () => {
    const res0 = calculateAQI(0);
    expect(res0.aqi).toBe(0);
    expect(res0.category).toBe('Good');

    const res15 = calculateAQI(15);
    expect(res15.aqi).toBe(25);
    expect(res15.category).toBe('Good');

    const res30 = calculateAQI(30);
    expect(res30.aqi).toBe(50);
    expect(res30.category).toBe('Good');
  });

  it('should correctly classify Satisfactory category (30-60 µg/m³ -> AQI 51-100)', () => {
    const res45 = calculateAQI(45);
    expect(res45.aqi).toBeGreaterThanOrEqual(51);
    expect(res45.aqi).toBeLessThanOrEqual(100);
    expect(res45.category).toBe('Satisfactory');
  });

  it('should correctly classify Moderate category (60-90 µg/m³ -> AQI 101-200)', () => {
    const res75 = calculateAQI(75);
    expect(res75.aqi).toBe(151);
    expect(res75.category).toBe('Moderate');
  });

  it('should correctly classify Poor category (90-120 µg/m³ -> AQI 201-300)', () => {
    const res105 = calculateAQI(105);
    expect(res105.aqi).toBe(251);
    expect(res105.category).toBe('Poor');
  });

  it('should correctly classify Very Poor category (120-250 µg/m³ -> AQI 301-400)', () => {
    const res185 = calculateAQI(185);
    expect(res185.aqi).toBeGreaterThanOrEqual(301);
    expect(res185.aqi).toBeLessThanOrEqual(400);
    expect(res185.category).toBe('Very Poor');
  });

  it('should correctly classify Severe category (250+ µg/m³ -> AQI 401-500)', () => {
    const res315 = calculateAQI(315);
    expect(res315.aqi).toBeGreaterThanOrEqual(401);
    expect(res315.category).toBe('Severe');

    const resExtreme = calculateAQI(450);
    expect(resExtreme.aqi).toBe(500);
    expect(resExtreme.category).toBe('Severe');
  });
});
