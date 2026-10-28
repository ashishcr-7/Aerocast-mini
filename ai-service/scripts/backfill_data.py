"""
Backfill script: Download historical Open-Meteo ERA5 weather data for Delhi NCR.
Run this ONCE before training. Takes ~2-3 minutes for 2 years of hourly data.

Usage:
    cd ai-service
    python scripts/backfill_data.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.data.ingestion import backfill_weather, fetch_openaq_locations_delhi
import logging

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

if __name__ == "__main__":
    print("=" * 60)
    print("Delhi NCR Air Pollution Forecasting — Data Backfill")
    print("=" * 60)
    print("\n1. Backfilling Open-Meteo ERA5 weather (Jan 2023 – Oct 2024)...")
    n = backfill_weather(start="2023-01-01", end="2024-10-01")
    print(f"   ✅ {n} weather rows ingested\n")

    print("2. Checking OpenAQ Delhi NCR locations...")
    locs = fetch_openaq_locations_delhi()
    if locs:
        print(f"   ✅ Found {len(locs)} Delhi NCR locations in OpenAQ")
        for loc in locs[:5]:
            print(f"      - {loc.get('name', 'Unknown')} (ID: {loc.get('id')})")
    else:
        print("   ⚠️  OpenAQ unavailable or no API key — AQ observations will be synthetic for demo")

    print("\nBackfill complete. Next step:")
    print("   python scripts/prepare_dataset.py")
