/**
 * update-live.js
 * One-stop command to update everything from the current time:
 * 1. Pulls live CPCB PM2.5 readings from OpenAQ.
 * 2. Pulls live weather forecast from Open-Meteo.
 * 3. Runs the XGBoost AI model to generate fresh +72h predictions from the current moment.
 */
import { prisma } from '../src/utils/prisma.js';
import { seedStations, fetchRecentObservations } from '../src/services/airQualityService.js';
import { fetchWeatherForecast } from '../src/services/weatherService.js';
import { mlService } from '../src/services/mlService.js';

async function updateLive() {
  console.log('====================================================');
  console.log(`[AeroCast Live Sync] Starting update at: ${new Date().toLocaleString()}`);
  console.log('====================================================\n');

  // Step 1: Ensure station metadata exists
  console.log('📍 1/3 Checking stations...');
  await seedStations();

  // Step 2: Live Weather
  console.log('\n🌡️  2/3 Fetching live weather from Open-Meteo (ECMWF)...');
  try {
    const wCount = await fetchWeatherForecast();
    console.log(`   ✅ Weather updated: ${wCount} hourly atmospheric records.`);
  } catch (err) {
    console.warn(`   ⚠️  Weather fetch notice: ${err.message}`);
  }

  // Step 3: Live PM2.5 from OpenAQ
  console.log('\n☁️  3/3 Fetching live sensor readings from OpenAQ (CPCB/DPCC)...');
  const stations = await prisma.station.findMany({ where: { isActive: true } });
  for (const st of stations) {
    if (!st.openaqId) continue;
    try {
      await fetchRecentObservations(st.openaqId, st.id, 48);
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.warn(`   ⚠️  ${st.name}: ${err.message}`);
    }
  }

  // Step 4: Run AI Forecasts for all stations
  console.log('\n🔮 Running XGBoost model to generate fresh 72h forecasts from current time...');
  for (const st of stations) {
    try {
      const res = await mlService.generateForecast(st.id, 72);
      console.log(`   ✅ ${st.name}: 72-hour forecast generated (Issued: ${new Date(res.issuedAt).toLocaleTimeString()})`);
    } catch (err) {
      console.warn(`   ⚠️  ${st.name} forecast notice: ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Live update complete! Refresh your browser to see the latest data.');
  console.log('====================================================');
  await prisma.$disconnect();
}

updateLive().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
