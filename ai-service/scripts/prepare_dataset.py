"""
Dataset preparation script: build the feature-engineered CSV from DB data.
Run after backfill_data.py.

Usage:
    cd ai-service
    python scripts/prepare_dataset.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.data.features import build_features, get_feature_columns, get_conn, load_weather_from_db, load_pollution_from_db
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

OUTPUT_DIR = Path("../data/processed")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    print("=" * 60)
    print("Delhi NCR — Dataset Preparation")
    print("=" * 60)

    conn = get_conn()
    print("\nLoading data from PostgreSQL...")
    weather_df = load_weather_from_db(conn)
    pm25_df = load_pollution_from_db(conn)
    conn.close()

    print(f"  Weather rows: {len(weather_df)}")
    print(f"  PM2.5 rows: {len(pm25_df)}")

    if pm25_df.empty:
        print("  ⚠️  No real PM2.5 observations — using labelled synthetic data for demo")

    print("\nBuilding features...")
    df = build_features(weather_df, pm25_df)

    out_path = OUTPUT_DIR / "features_dataset.csv"
    df.to_csv(out_path)
    print(f"\n✅ Dataset saved: {out_path}")
    print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"   Date range: {df.index[0]} → {df.index[-1]}")
    print(f"   PM2.5 stats: min={df['pm25'].min():.1f} max={df['pm25'].max():.1f} mean={df['pm25'].mean():.1f} µg/m³")

    print("\nNext step:")
    print("   cd ai-service && python -m app.models.train")
