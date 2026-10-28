/**
 * seed-recent-obs.js
 * Seeds realistic PM2.5 observations for the past 48 hours for all Delhi NCR stations.
 * Uses a diurnal pattern typical of Delhi winter pollution.
 * Run once: node scripts/seed-recent-obs.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Delhi winter pollution diurnal pattern (PM2.5 µg/m³)
// Higher at night/morning due to boundary layer collapse; lower midday due to convection
const DIURNAL_BASE = {
   0: 210, 1: 225, 2: 235, 3: 240, 4: 245, 5: 250,
   6: 240, 7: 220, 8: 195, 9: 170, 10: 145, 11: 125,
  12: 110, 13: 100, 14:  95, 15:  98, 16: 110, 17: 130,
  18: 155, 19: 175, 20: 190, 21: 200, 22: 205, 23: 208,
};

// Per-station variation factors (local source proximity)
const STATION_FACTORS = {
  'Anand Vihar':       1.25,  // Near highway — elevated
  'Punjabi Bagh':      1.10,
  'RK Puram':          0.95,
  'ITO':               1.15,
  'Mandir Marg':       1.00,
  'Lodhi Road':        0.90,  // Less industrial
  'Dwarka Sec 8':      0.95,
  'Rohini':            1.05,
  'Gurugram Sector 51':0.85,
  'Noida Sector 62':   1.10,
};

function jitter(value, pct = 0.08) {
  return value * (1 + (Math.random() * 2 - 1) * pct);
}

async function main() {
  console.log('[Seed] Fetching stations from DB...');
  const stations = await prisma.station.findMany();
  console.log(`[Seed] Found ${stations.length} stations`);

  const now = new Date();
  // Snap to the start of the current hour
  now.setMinutes(0, 0, 0);

  let totalInserted = 0;

  for (const station of stations) {
    const factor = STATION_FACTORS[station.name] ?? 1.0;

    for (let h = 47; h >= 0; h--) {
      const ts = new Date(now.getTime() - h * 3600_000);
      const hour = ts.getUTCHours();
      const base = DIURNAL_BASE[hour] ?? 150;
      const value = Math.max(10, Math.round(jitter(base * factor) * 10) / 10);

      try {
        await prisma.pollutionObservation.upsert({
          where: {
            stationId_timestamp_pollutant: {
              stationId: station.id,
              timestamp: ts,
              pollutant: 'pm25',
            },
          },
          update: { value },
          create: {
            stationId: station.id,
            timestamp: ts,
            pollutant: 'pm25',
            value,
            unit: 'µg/m³',
            source: 'CPCB-Synthetic-Seed',
          },
        });
        totalInserted++;
      } catch (err) {
        console.error(`[Seed] Error for ${station.name} at ${ts.toISOString()}:`, err.message);
      }
    }

    console.log(`[Seed] ✅ ${station.name} — seeded 48 hourly observations`);
  }

  console.log(`\n[Seed] Complete. Total records upserted: ${totalInserted}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
