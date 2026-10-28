"""
Feature engineering: build the training dataset from weather + pollution observations.
All features are computed from data available at forecast issue time (no leakage).
"""
import os
import logging
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import DictCursor
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/airpollution")


def get_conn():
    url = DATABASE_URL.replace("postgresql://", "").replace("postgres://", "")
    user_pass, rest = url.split("@")
    user, password = user_pass.split(":")
    host_port_db = rest.split("/")
    db = host_port_db[1]
    host_port = host_port_db[0].split(":")
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 5432
    return psycopg2.connect(host=host, port=port, dbname=db, user=user, password=password)


def load_weather_from_db(conn) -> pd.DataFrame:
    with conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute("""
            SELECT timestamp, temperature, humidity, "windSpeed", "windDirection",
                   precipitation, pressure, "boundaryLayerHeight"
            FROM "WeatherObservation"
            ORDER BY timestamp ASC
        """)
        rows = cur.fetchall()
    df = pd.DataFrame(rows, columns=[
        "timestamp", "temperature", "humidity", "windSpeed", "windDirection",
        "precipitation", "pressure", "boundaryLayerHeight"
    ])
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df = df.set_index("timestamp").sort_index()
    return df


def load_pollution_from_db(conn) -> pd.DataFrame:
    with conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute("""
            SELECT timestamp, value, pollutant, "stationId"
            FROM "PollutionObservation"
            WHERE pollutant = 'pm25' AND value >= 0 AND value < 2000
            ORDER BY timestamp ASC
        """)
        rows = cur.fetchall()
    if not rows:
        logger.warning("No PM2.5 observations in DB — will use synthetic data for feature demo")
        return pd.DataFrame()
    df = pd.DataFrame(rows, columns=["timestamp", "pm25", "pollutant", "stationId"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df = df.set_index("timestamp").sort_index()
    return df[["pm25"]]


def build_features(weather_df: pd.DataFrame, pm25_df: pd.DataFrame) -> pd.DataFrame:
    """
    Join weather and PM2.5, compute lag features, rolling averages, and
    calendar features. Returns a dataframe ready for ML training.
    No future leakage — all lag and rolling features use only past data.
    """
    # Hourly resample to ensure regular grid
    weather_h = weather_df.resample("1h").mean()

    if pm25_df.empty:
        logger.warning("Using synthetic PM2.5 based on weather patterns (labelled demo data)")
        # Synthetic but structurally valid — never claimed as real observations
        np.random.seed(42)
        # Delhi-realistic pattern: higher in winter, lower in summer, diurnal cycle
        idx = weather_h.index
        seasonal = 80 + 80 * np.cos((idx.dayofyear - 15) * 2 * np.pi / 365)
        diurnal = 20 * np.cos((idx.hour - 6) * 2 * np.pi / 24)
        wind_effect = np.where(weather_h["windSpeed"].fillna(10) > 15, -30, 0)
        noise = np.random.normal(0, 15, len(idx))
        pm25_values = np.clip(seasonal + diurnal + wind_effect + noise, 5, 500)
        pm25_series = pd.Series(pm25_values, index=idx, name="pm25")
    else:
        # Merge onto hourly weather grid
        pm25_h = pm25_df.resample("1h").mean()
        pm25_series = pm25_h["pm25"]

    df = weather_h.join(pm25_series, how="left")
    df = df.rename(columns={
        "windSpeed": "wind_speed", "windDirection": "wind_dir",
        "boundaryLayerHeight": "pbl_height",
    })

    # ---- Lag features (1, 2, 3, 6, 12, 24, 48 hours) ----
    for lag in [1, 2, 3, 6, 12, 24, 48]:
        df[f"pm25_lag_{lag}h"] = df["pm25"].shift(lag)

    # ---- Rolling averages (no future leakage — shift(1) ensures past-only) ----
    for window in [6, 12, 24]:
        df[f"pm25_roll_mean_{window}h"] = df["pm25"].shift(1).rolling(window, min_periods=max(window//2, 1)).mean()
        df[f"pm25_roll_std_{window}h"] = df["pm25"].shift(1).rolling(window, min_periods=max(window//2, 1)).std()

    # ---- Calendar features ----
    df["hour"] = df.index.hour
    df["dayofweek"] = df.index.dayofweek
    df["month"] = df.index.month
    df["dayofyear"] = df.index.dayofyear
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["doy_sin"] = np.sin(2 * np.pi * df["dayofyear"] / 365)
    df["doy_cos"] = np.cos(2 * np.pi * df["dayofyear"] / 365)

    # ---- Wind components ----
    df["wind_u"] = df["wind_speed"] * np.sin(np.radians(df["wind_dir"].fillna(0)))
    df["wind_v"] = df["wind_speed"] * np.cos(np.radians(df["wind_dir"].fillna(0)))

    # Drop rows with missing target
    df = df.dropna(subset=["pm25"])

    # Drop first 48h (insufficient lag history)
    if len(df) > 48:
        df = df.iloc[48:]

    logger.info(f"Feature set: {len(df)} rows, {len(df.columns)} columns")
    return df


def get_feature_columns() -> list[str]:
    """Return ordered list of feature column names used in training."""
    weather_feats = ["temperature", "humidity", "wind_speed", "wind_dir",
                     "precipitation", "pressure", "pbl_height", "wind_u", "wind_v"]
    lag_feats = [f"pm25_lag_{l}h" for l in [1, 2, 3, 6, 12, 24, 48]]
    roll_feats = []
    for w in [6, 12, 24]:
        roll_feats += [f"pm25_roll_mean_{w}h", f"pm25_roll_std_{w}h"]
    cal_feats = ["hour_sin", "hour_cos", "doy_sin", "doy_cos",
                 "hour", "dayofweek", "month"]
    return weather_feats + lag_feats + roll_feats + cal_feats
