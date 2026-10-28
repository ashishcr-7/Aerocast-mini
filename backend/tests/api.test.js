import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

describe('Express API Integration Tests', () => {
  it('GET /api/stations should return 200 with list of Delhi NCR stations', async () => {
    const res = await request(app).get('/api/stations');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stations');
    expect(Array.isArray(res.body.stations)).toBe(true);
    expect(res.body.stations.length).toBeGreaterThanOrEqual(1);

    const station = res.body.stations[0];
    expect(station).toHaveProperty('id');
    expect(station).toHaveProperty('name');
    expect(station).toHaveProperty('latitude');
    expect(station).toHaveProperty('longitude');
  });

  it('GET /api/model/metrics should return 200 with model benchmarks', async () => {
    const res = await request(app).get('/api/model/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('models');
    expect(Array.isArray(res.body.models)).toBe(true);
    expect(res.body.models.length).toBeGreaterThanOrEqual(3);

    const firstModel = res.body.models[0];
    expect(firstModel).toHaveProperty('modelName');
    expect(firstModel).toHaveProperty('horizons');
    expect(Array.isArray(firstModel.horizons)).toBe(true);
    expect(firstModel.horizons[0]).toHaveProperty('mae');
    expect(firstModel.horizons[0]).toHaveProperty('rmse');
    expect(firstModel.horizons[0]).toHaveProperty('r2');
  });

  it('GET /api/health should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 207]).toContain(res.status);
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('database');
    expect(res.body.services).toHaveProperty('aiService');
  });

  it('GET /api/forecast without stationId should return 400', async () => {
    const res = await request(app).get('/api/forecast');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
