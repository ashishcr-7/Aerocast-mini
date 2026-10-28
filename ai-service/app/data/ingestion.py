"""
Data ingestion: fetch historical weather from Open-Meteo ERA5 archive and
(if API key is available) air quality data from OpenAQ v3.
"""
import os
import json
import time
import logging
import requests
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(name)s: %(message)s")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/airpollution")
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", "")
DELHI_LAT = 28.6139
DELHI_LON = 77.2090

WEATHER_VARS = ",".join([
    "temperature_2m", "relativehumidity_2m", "windspeed_10m",
    "winddirection_10m", "precipitation", "surface_pressure",
    "boundary_layer_height",
])


def get_conn():
    """Connect to PostgreSQL using the DATABASE_URL."""
    # Parse the URL manually for psycopg2
    url = DATABASE_URL.replace("postgresql://", "").replace("postgres://", "")
    user_pass, rest = url.split("@")
    user, password = user_pass.split(":")
    host_port_db = rest.split("/")
    db = host_port_db[1]
    host_port = host_port_db[0].split(":")
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 5432
    return psycopg2.connect(host=host, port=port, dbname=db, user=user, password=password)


def fetch_weather_chunk(start_date: str, end_date: str) -> list[dict]:
    """Fetch hourly weather from Open-Meteo ERA5 archive for a date range."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": DELHI_LAT,
        "longitude": DELHI_LON,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": WEATHER_VARS,
        "timezone": "UTC",
    }
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            h = data["hourly"]
            rows = []
            for i, t in enumerate(h["time"]):
                rows.append({
                    "timestamp": t + ":00Z",
                    "temperature": h["temperature_2m"][i],
                    "humidity": h["relativehumidity_2m"][i],
                    "wind_speed": h["windspeed_10m"][i],
                    "wind_direction": h["winddirection_10m"][i],
                    "precipitation": h["precipitation"][i],
                    "pressure": h["surface_pressure"][i],
                    "boundary_layer_height": (h.get("boundary_layer_height") or [None] * len(h["time"]))[i],
                    "source": "Open-Meteo-ERA5",
                    "latitude": DELHI_LAT,
                    "longitude": DELHI_LON,
                })
            return rows
        except Exception as e:
            logger.warning(f"Weather fetch attempt {attempt+1} failed: {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to fetch weather for {start_date} to {end_date}")


def insert_weather_rows(conn, rows: list[dict]):
    """Upsert weather rows into WeatherObservation table."""
    if not rows:
        return 0
    with conn.cursor() as cur:
        values = [(
            r["latitude"], r["longitude"], r["timestamp"],
            r["temperature"], r["humidity"], r["wind_speed"],
            r["wind_direction"], r["precipitation"], r["pressure"],
            r["boundary_layer_height"], r["source"],
        ) for r in rows]
        execute_values(cur, """
            INSERT INTO "WeatherObservation"
                (latitude, longitude, timestamp, temperature, humidity,
                 "windSpeed", "windDirection", precipitation, pressure,
                 "boundaryLayerHeight", source, "fetchedAt")
            VALUES %s
            ON CONFLICT (latitude, longitude, timestamp) DO UPDATE SET
                temperature = EXCLUDED.temperature,
                humidity = EXCLUDED.humidity,
                "windSpeed" = EXCLUDED."windSpeed",
                "windDirection" = EXCLUDED."windDirection",
                precipitation = EXCLUDED.precipitation,
                pressure = EXCLUDED.pressure,
                "boundaryLayerHeight" = EXCLUDED."boundaryLayerHeight",
                "fetchedAt" = NOW()
        """, [(v + (datetime.utcnow(),)) for v in values])
    conn.commit()
    return len(rows)


def backfill_weather(start: str = "2023-01-01", end: str = "2024-10-01"):
    """Backfill ERA5 weather in monthly chunks."""
    conn = get_conn()
    logger.info(f"Backfilling weather {start} → {end}")

    current = datetime.strptime(start, "%Y-%m-%d").date()
    end_date = datetime.strptime(end, "%Y-%m-%d").date()
    total = 0

    while current < end_date:
        chunk_end = min(current + timedelta(days=30), end_date)
        try:
            rows = fetch_weather_chunk(str(current), str(chunk_end))
            n = insert_weather_rows(conn, rows)
            total += n
            logger.info(f"  {current} → {chunk_end}: {n} rows")
        except Exception as e:
            logger.error(f"  Chunk {current} failed: {e}")
        current = chunk_end + timedelta(days=1)
        time.sleep(0.5)  # Polite rate limiting

    conn.close()
    logger.info(f"Weather backfill complete: {total} total rows")
    return total


def fetch_openaq_locations_delhi() -> list[dict]:
    """List Delhi NCR locations from OpenAQ v3."""
    if not OPENAQ_API_KEY:
        logger.warning("No OPENAQ_API_KEY — skipping AQ data fetch")
        return []

    url = "https://api.openaq.org/v3/locations"
    params = {"country_id": "IN", "limit": 100}
    headers = {"X-API-Key": OPENAQ_API_KEY}

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        # Filter Delhi NCR by lat/lon bounding box
        delhi_locs = [
            r for r in results
            if r.get("coordinates") and
            28.2 <= r["coordinates"]["latitude"] <= 29.0 and
            76.8 <= r["coordinates"]["longitude"] <= 77.8
        ]
        logger.info(f"Found {len(delhi_locs)} Delhi NCR locations in OpenAQ")
        return delhi_locs
    except Exception as e:
        logger.error(f"OpenAQ locations fetch failed: {e}")
        return []


if __name__ == "__main__":
    logger.info("=== Delhi NCR Data Backfill ===")
    backfill_weather(start="2023-01-01", end="2024-10-01")
    logger.info("Done. Run prepare_dataset.py next.")
