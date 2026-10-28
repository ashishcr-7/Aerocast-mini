import axios from 'axios';
import { config } from '../src/config/env.js';

async function testEndpoints() {
  const sensorId = 23534;
  console.log('Testing /sensors/' + sensorId + '/measurements with order_by=datetime...');
  try {
    const res = await axios.get(`https://api.openaq.org/v3/sensors/${sensorId}/measurements`, {
      headers: { 'X-API-Key': config.openaqApiKey },
      params: { limit: 10, order_by: 'datetime', sort_order: 'desc' },
      timeout: 15000,
    });
    console.log('Success with order_by datetime:');
    console.log(res.data.results.map(r => ({ value: r.value, period: r.period })));
  } catch (e) {
    console.error('Failed:', e.response?.data || e.message);
  }

  console.log('\nTesting /locations/8118/latest...');
  try {
    const res2 = await axios.get(`https://api.openaq.org/v3/locations/8118/latest`, {
      headers: { 'X-API-Key': config.openaqApiKey },
      timeout: 15000,
    });
    console.log('Locations 8118 latest:');
    console.log(JSON.stringify(res2.data, null, 2));
  } catch (e) {
    console.error('Failed 8118:', e.response?.data || e.message);
  }
}

testEndpoints();
