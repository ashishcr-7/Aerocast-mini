/**
 * dedupe-forecasts.js
 * Keeps only the latest issuedAt batch for each (stationId, leadHours) combination.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the most recent issuedAt for each station
  const stations = await prisma.station.findMany();

  for (const station of stations) {
    // Get latest issuedAt for this station
    const latest = await prisma.forecast.findFirst({
      where: { stationId: station.id, pollutant: 'pm25' },
      orderBy: { issuedAt: 'desc' },
    });

    if (!latest) continue;

    // Delete all older forecast runs for this station
    const deleted = await prisma.forecast.deleteMany({
      where: {
        stationId: station.id,
        pollutant: 'pm25',
        issuedAt: { lt: latest.issuedAt },
      },
    });

    if (deleted.count > 0) {
      console.log(`[${station.name}] Removed ${deleted.count} stale forecast entries (kept issuedAt: ${latest.issuedAt.toISOString()})`);
    }
  }

  console.log('\n[Done] Forecast deduplication complete.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
