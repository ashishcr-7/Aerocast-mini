"""
Model inference: load trained artifacts and generate 72-hour PM2.5 forecasts.
"""
import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
ARTIFACTS_DIR = Path(os.getenv("MODEL_ARTIFACTS_DIR", "./artifacts"))

_model = None
_schema = None
MODEL_LOADED = False


def load_model():
    global _model, _schema, MODEL_LOADED

    schema_path = ARTIFACTS_DIR / "model_schema.json"
    if not schema_path.exists():
        raise FileNotFoundError(f"No model schema at {schema_path}")

    with open(schema_path) as f:
        _schema = json.load(f)

    model_name = _schema["model_name"]
    model_path = ARTIFACTS_DIR / f"{model_name}_pm25.joblib"
    if not model_path.exists():
        raise FileNotFoundError(f"No model file at {model_path}")

    _model = joblib.load(model_path)
    MODEL_LOADED = True
    logger.info(f"Model loaded: {model_name} (trained {_schema.get('trained_at', 'unknown')})")


def get_model_info() -> dict:
    if not MODEL_LOADED or _schema is None:
        return {"status": "not_loaded"}
    return {
        "status": "loaded",
        "model_name": _schema["model_name"],
        "trained_at": _schema.get("trained_at"),
        "train_period": _schema.get("train_period"),
        "test_period": _schema.get("test_period"),
        "feature_count": len(_schema.get("feature_columns", [])),
    }


def _build_feature_row(issued_ts: datetime, step_hour: int, pm25_history: list[float],
                        weather_future: dict, feature_cols: list[str]) -> dict:
    """Build a single feature row for a specific future step."""
    row = {}

    # Weather features
    weather_map = {
        "temperature": "temperature", "humidity": "humidity",
        "wind_speed": "wind_speed", "wind_dir": "wind_direction",
        "precipitation": "precipitation", "pressure": "pressure",
        "pbl_height": "boundary_layer_height",
    }
    for feat, key in weather_map.items():
        row[feat] = weather_future.get(key)

    # Wind components
    ws = row.get("wind_speed") or 0
    wd = row.get("wind_dir") or 0
    row["wind_u"] = ws * np.sin(np.radians(wd))
    row["wind_v"] = ws * np.cos(np.radians(wd))

    # Lag features from pm25_history (most recent first)
    for lag in [1, 2, 3, 6, 12, 24, 48]:
        idx = lag - 1 + step_hour  # look further back for later steps
        if idx < len(pm25_history):
            row[f"pm25_lag_{lag}h"] = pm25_history[-(idx + 1)]
        else:
            row[f"pm25_lag_{lag}h"] = pm25_history[0] if pm25_history else None

    # Rolling averages from history
    for window in [6, 12, 24]:
        hist = pm25_history[-window:] if len(pm25_history) >= window else pm25_history
        row[f"pm25_roll_mean_{window}h"] = float(np.mean(hist)) if hist else None
        row[f"pm25_roll_std_{window}h"] = float(np.std(hist)) if len(hist) > 1 else 0.0

    # Calendar
    forecast_time = issued_ts.replace(tzinfo=timezone.utc)
    hour = (issued_ts.hour + step_hour) % 24
    doy = issued_ts.timetuple().tm_yday
    row["hour"] = hour
    row["dayofweek"] = issued_ts.weekday()
    row["month"] = issued_ts.month
    row["dayofyear"] = doy
    row["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    row["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    row["doy_sin"] = np.sin(2 * np.pi * doy / 365)
    row["doy_cos"] = np.cos(2 * np.pi * doy / 365)

    return row


def predict_72h(station_id: str, issued_at: str, recent_pm25: list[dict],
                weather_data: list[dict], forecast_hours: int = 72) -> dict:
    if not MODEL_LOADED:
        raise RuntimeError("Model not loaded")

    feature_cols = _schema["feature_columns"]
    issued_ts = datetime.fromisoformat(issued_at.replace("Z", "+00:00"))

    # Build PM2.5 history array (ascending time order)
    pm25_values = [o["value"] for o in sorted(recent_pm25, key=lambda x: x["timestamp"])]

    # Index weather_data by timestamp for fast lookup
    weather_index = {}
    for w in weather_data:
        ts = w["timestamp"][:16]  # YYYY-MM-DDTHH:MM
        weather_index[ts] = w

    forecasts = []
    from datetime import timedelta

    for h in range(1, forecast_hours + 1):
        forecast_time = issued_ts + timedelta(hours=h)
        ts_key = forecast_time.strftime("%Y-%m-%dT%H:%M")

        # Get weather at this forecast hour (future weather from Open-Meteo forecast)
        w = weather_index.get(ts_key, {})
        if not w:
            # Try closest available
            w = weather_index.get(list(weather_index.keys())[-1], {}) if weather_index else {}

        row = _build_feature_row(issued_ts, h, pm25_values, w, feature_cols)

        # Build DataFrame row
        feat_df = pd.DataFrame([row])[feature_cols]

        pred = _model.predict(feat_df)
        # pred shape: (1, 72) — we want the +h column
        h_idx = min(h - 1, pred.shape[1] - 1)
        predicted_pm25 = float(np.clip(pred[0, h_idx], 0, 999))

        data_quality = "ok"
        if not w:
            data_quality = "degraded_no_weather"
        elif len(pm25_values) < 6:
            data_quality = "degraded_few_observations"

        # Uncertainty interval widens with lead horizon
        uncertainty = 8.0 + (h / forecast_hours) * 26.0
        lower_bound = max(0.0, round(predicted_pm25 - uncertainty, 2))
        upper_bound = round(predicted_pm25 + uncertainty, 2)

        forecasts.append({
            "lead_hours": h,
            "forecast_time": forecast_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "predicted_pm25": round(predicted_pm25, 2),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "data_quality": data_quality,
        })

    return {
        "station_id": station_id,
        "issued_at": issued_at,
        "model_version": f"{_schema['model_name']}_v1",
        "forecast_hours": forecast_hours,
        "data_quality_summary": "ok" if all(f["data_quality"] == "ok" for f in forecasts) else "degraded",
        "forecasts": forecasts,
    }
