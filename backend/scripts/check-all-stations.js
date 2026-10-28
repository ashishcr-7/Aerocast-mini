import axios from 'axios';
import { config } from '../src/config/env.js';
import { DELHI_STATIONS } from '../src/services/airQualityService.js';

async function checkAllStations() {
  console.log('Checking live readings for all 10 Delhi NCR stations via OpenAQ:');
  for (const st of DELHI_STATIONS) {
    try {
      const res = await axios.get(`https://api.openaq.org/v3/locations/${st.openaqId}/latest`, {
        headers: { 'X-API-Key': config.openaqApiKey },
        timeout: 10000,
      });
      const results = res.data.results || [];
      const pm25 = results[0];
      if (pm25) {
        console.log(`✅ ${st.name} (Location ${st.openaqId}): PM2.5 = ${pm25.value} µg/m³ at ${pm25.datetime?.local || pm25.datetime?.utc}`);
      } else {
        console.log(`⚠️ ${st.name}: no latest measurement`);
      }
    } catch (err) {
      console.log(`❌ ${st.name} (${st.openaqId}): ${err.response?.status || err.message}`);
    }
  }
}

checkAllStations();
