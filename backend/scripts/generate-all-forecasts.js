import { prisma } from '../src/utils/prisma.js';
import { mlService } from '../src/services/mlService.js';

async function generateAllLiveForecasts() {
  console.log('Generating fresh live 72h forecasts for all stations...');
  const stations = await prisma.station.findMany({ where: { isActive: true } });

  for (const st of stations) {
    try {
      console.log(`Forecasting for ${st.name}...`);
      const res = await mlService.generateForecast(st.id, 72);
      console.log(`✅ ${st.name}: Generated ${res.forecasts?.length || 0} forecast hours (Issued: ${res.issuedAt})`);
    } catch (e) {
      console.error(`❌ ${st.name} failed:`, e.message);
    }
  }

  console.log('\nAll stations updated with live 72h forecasts!');
  await prisma.$disconnect();
}

generateAllLiveForecasts().catch(e => {
  console.error(e);
  process.exit(1);
});
