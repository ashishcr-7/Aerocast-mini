import axios from 'axios';
import { config } from '../src/config/env.js';

async function main() {
  console.log('Testing with API key:', config.openaqApiKey?.slice(0, 8) + '...');
  try {
    const res = await axios.get('https://api.openaq.org/v3/sensors/23534', {
      headers: { 'X-API-Key': config.openaqApiKey },
      timeout: 10000,
    });
    console.log('Sensor 23534 metadata:');
    console.log(JSON.stringify(res.data, null, 2));

    console.log('\nTesting latest measurement...');
    const mRes = await axios.get('https://api.openaq.org/v3/sensors/23534/measurements', {
      headers: { 'X-API-Key': config.openaqApiKey },
      params: { limit: 5 },
      timeout: 10000,
    });
    console.log('Measurements:');
    console.log(JSON.stringify(mRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

main();
