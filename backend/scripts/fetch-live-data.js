import { config } from '../src/config/env.js';
import { seedStations, fetchRecentObservations, DELHI_STATIONS } from '../src/services/airQualityService.js';
import { fetchWeatherForecast } from '../src/services/weatherService.js';
import { prisma } from '../src/utils/prisma.js';

async function testFetch() {
  console.log('[OpenAQ] API Key configured:', config.openaqEnabled ? 'YES' : 'NO');
  console.log('[OpenAQ] Seeding/checking stations...');
  await seedStations();

  console.log('\n[Weather] Fetching live weather forecast from Open-Meteo...');
  try {
    const wCount = await fetchWeatherForecast();
    console.log(`[Weather] ✅ Inserted ${wCount} weather records`);
  } catch (err) {
    console.error('[Weather] ❌ Failed:', err.message);
  }

  console.log('\n[OpenAQ] Fetching live observations for Anand Vihar (8118)...');
  const station = await prisma.station.findFirst({ where: { openaqId: '8118' } });
  if (!station) {
    console.error('Station not found');
    return;
  }

  const count = await fetchRecentObservations('8118', station.id, 48);
  console.log(`[OpenAQ] Anand Vihar result: ${count} real records inserted`);

  const latestObs = await prisma.pollutionObservation.findFirst({
    where: { stationId: station.id, pollutant: 'pm25' },
    orderBy: { timestamp: 'desc' },
  });
  console.log('\n[Latest PM2.5 in DB]:', latestObs);

  await prisma.$disconnect();
}

testFetch().catch(e => {
  console.error(e);
  process.exit(1);
});
