import { prisma } from '../src/utils/prisma.js';
import { seedStations, fetchRecentObservations } from '../src/services/airQualityService.js';
import { fetchWeatherForecast } from '../src/services/weatherService.js';

async function syncRealData() {
  console.log('--- 1. Ensuring stations exist ---');
  await seedStations();

  console.log('\n--- 2. Updating live weather forecast from Open-Meteo ---');
  try {
    const wCount = await fetchWeatherForecast();
    console.log(`✅ Weather synced: ${wCount} records`);
  } catch (e) {
    console.error('Weather sync failed:', e.message);
  }

  console.log('\n--- 3. Fetching live air quality readings for all stations from OpenAQ ---');
  const stations = await prisma.station.findMany({ where: { isActive: true } });
  let totalSaved = 0;

  for (const st of stations) {
    if (!st.openaqId) continue;
    try {
      const count = await fetchRecentObservations(st.openaqId, st.id, 48);
      totalSaved += count;
      await new Promise(r => setTimeout(r, 600)); // Be gentle with rate limit
    } catch (e) {
      console.warn(`Station ${st.name} error:`, e.message);
    }
  }

  console.log(`\n🎉 Air Quality sync complete! Total observations: ${totalSaved}`);

  // Display Anand Vihar current status
  const anandVihar = await prisma.station.findFirst({ where: { name: 'Anand Vihar' } });
  if (anandVihar) {
    const latest = await prisma.pollutionObservation.findFirst({
      where: { stationId: anandVihar.id, pollutant: 'pm25' },
      orderBy: { timestamp: 'desc' },
    });
    console.log('\n[Anand Vihar Current DB State]:', {
      value: latest?.value,
      timestamp: latest?.timestamp,
      source: latest?.source,
    });
  }

  await prisma.$disconnect();
}

syncRealData().catch(e => {
  console.error(e);
  process.exit(1);
});
