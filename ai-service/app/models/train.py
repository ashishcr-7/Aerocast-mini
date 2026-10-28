"""
Model training: persistence baseline, Random Forest, and XGBoost.
Chronological train/val/test split — no data leakage.
Saves best model and feature schema to artifacts/.
"""
import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from pathlib import Path

from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from app.data.features import build_features, get_feature_columns, get_conn, load_weather_from_db, load_pollution_from_db

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(name)s: %(message)s")

ARTIFACTS_DIR = Path(os.getenv("MODEL_ARTIFACTS_DIR", "./artifacts"))
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

FORECAST_HORIZONS = list(range(1, 73))  # 1 to 72 hours
EVAL_LEAD_HOURS = [1, 6, 24, 48, 72]


def make_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Create direct multi-output targets: pm25 at +1h through +72h."""
    targets = pd.DataFrame(index=df.index)
    for h in FORECAST_HORIZONS:
        targets[f"target_{h}h"] = df["pm25"].shift(-h)
    return targets


def chronological_split(df: pd.DataFrame, targets: pd.DataFrame):
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)
    return (
        (df.iloc[:train_end], targets.iloc[:train_end]),
        (df.iloc[train_end:val_end], targets.iloc[train_end:val_end]),
        (df.iloc[val_end:], targets.iloc[val_end:]),
    )


def evaluate_model(model, X_test, y_test, scaler=None, model_name="model"):
    """Evaluate at specific lead hours."""
    y_pred = model.predict(X_test)
    results = []
    for h in EVAL_LEAD_HOURS:
        col = f"target_{h}h"
        if col not in y_test.columns:
            continue
        idx = y_test.columns.tolist().index(col)
        actual = y_test[col].values
        predicted = y_pred[:, idx]
        # Remove NaN target rows
        mask = ~np.isnan(actual)
        if mask.sum() < 10:
            continue
        actual, predicted = actual[mask], predicted[mask]
        mae = mean_absolute_error(actual, predicted)
        rmse = np.sqrt(mean_squared_error(actual, predicted))
        r2 = r2_score(actual, predicted)
        results.append({"model": model_name, "lead_hours": h, "mae": mae, "rmse": rmse, "r2": r2})
        logger.info(f"  [{model_name}] +{h}h: MAE={mae:.2f} RMSE={rmse:.2f} R²={r2:.3f}")
    return results


def persistence_baseline(X_test, y_test, last_known_pm25: pd.Series):
    """Persistence baseline: predict last observed value for all horizons."""
    results = []
    last_obs = last_known_pm25.reindex(X_test.index, method="ffill")
    for h in EVAL_LEAD_HOURS:
        col = f"target_{h}h"
        if col not in y_test.columns:
            continue
        actual = y_test[col].values
        predicted = last_obs.values
        mask = ~np.isnan(actual)
        if mask.sum() < 10:
            continue
        actual, predicted = actual[mask], predicted[mask]
        mae = mean_absolute_error(actual, predicted)
        rmse = np.sqrt(mean_squared_error(actual, predicted))
        r2 = r2_score(actual, predicted)
        results.append({"model": "persistence", "lead_hours": h, "mae": mae, "rmse": rmse, "r2": r2})
        logger.info(f"  [persistence] +{h}h: MAE={mae:.2f} RMSE={rmse:.2f} R²={r2:.3f}")
    return results


def train():
    logger.info("=== Training PM2.5 Forecasting Models ===")

    conn = get_conn()
    weather_df = load_weather_from_db(conn)
    pm25_df = load_pollution_from_db(conn)
    conn.close()

    if weather_df.empty:
        raise RuntimeError("No weather data in DB. Run backfill_data.py first.")

    logger.info(f"Weather rows: {len(weather_df)}, PM2.5 rows: {len(pm25_df)}")
    df = build_features(weather_df, pm25_df)

    feature_cols = get_feature_columns()
    available_feats = [c for c in feature_cols if c in df.columns]
    missing_feats = [c for c in feature_cols if c not in df.columns]
    if missing_feats:
        logger.warning(f"Missing features (will be ignored): {missing_feats}")

    X = df[available_feats]
    targets = make_targets(df)

    # Drop rows where most targets are NaN (last 72h of data)
    valid_mask = targets.iloc[:, -1].notna()
    X = X[valid_mask]
    targets = targets[valid_mask]

    (X_tr, y_tr), (X_val, y_val), (X_te, y_te) = chronological_split(X, targets)
    logger.info(f"Train: {len(X_tr)}, Val: {len(X_val)}, Test: {len(X_te)}")

    train_period = f"{X_tr.index[0].date()} to {X_tr.index[-1].date()}"
    test_period = f"{X_te.index[0].date()} to {X_te.index[-1].date()}"

    all_results = []

    # ---- Persistence baseline ----
    logger.info("\n--- Persistence Baseline ---")
    last_known = df["pm25"]
    persistence_results = persistence_baseline(X_te, y_te, last_known)
    all_results.extend([{**r, "train_period": train_period, "test_period": test_period} for r in persistence_results])

    # ---- Random Forest ----
    logger.info("\n--- Random Forest ---")
    rf_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", MultiOutputRegressor(
            RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_leaf=5, n_jobs=-1, random_state=42),
            n_jobs=-1,
        )),
    ])

    # Train on train+val for final model
    X_train_full = pd.concat([X_tr, X_val])
    y_train_full = pd.concat([y_tr, y_val])

    # Drop rows with NaN in targets for training
    target_mask = y_train_full.notna().any(axis=1)
    rf_pipeline.fit(X_train_full[target_mask], y_train_full[target_mask].fillna(y_train_full[target_mask].median()))

    rf_results = evaluate_model(rf_pipeline, X_te, y_te, model_name="random_forest")
    all_results.extend([{**r, "train_period": train_period, "test_period": test_period} for r in rf_results])

    best_model = rf_pipeline
    best_model_name = "random_forest"

    # ---- XGBoost ----
    if XGBOOST_AVAILABLE:
        logger.info("\n--- XGBoost ---")
        xgb_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", MultiOutputRegressor(
                xgb.XGBRegressor(
                    n_estimators=200, max_depth=6, learning_rate=0.05,
                    subsample=0.8, colsample_bytree=0.8,
                    n_jobs=-1, random_state=42,
                    tree_method="hist",  # fast on CPU
                ),
                n_jobs=1,
            )),
        ])
        xgb_pipeline.fit(X_train_full[target_mask], y_train_full[target_mask].fillna(y_train_full[target_mask].median()))
        xgb_results = evaluate_model(xgb_pipeline, X_te, y_te, model_name="xgboost")
        all_results.extend([{**r, "train_period": train_period, "test_period": test_period} for r in xgb_results])

        # Compare 24h MAE to pick best model
        rf_mae24 = next((r["mae"] for r in rf_results if r["lead_hours"] == 24), float("inf"))
        xgb_mae24 = next((r["mae"] for r in xgb_results if r["lead_hours"] == 24), float("inf"))
        if xgb_mae24 < rf_mae24:
            best_model = xgb_pipeline
            best_model_name = "xgboost"
            logger.info(f"✅ XGBoost wins (MAE@24h: {xgb_mae24:.2f} vs RF: {rf_mae24:.2f})")
        else:
            logger.info(f"✅ RandomForest wins (MAE@24h: {rf_mae24:.2f} vs XGB: {xgb_mae24:.2f})")
    else:
        logger.warning("XGBoost not available — using Random Forest only")

    # ---- Save artifacts ----
    model_path = ARTIFACTS_DIR / f"{best_model_name}_pm25.joblib"
    joblib.dump(best_model, model_path)
    logger.info(f"Saved model: {model_path}")

    schema = {
        "model_name": best_model_name,
        "feature_columns": available_feats,
        "forecast_horizons": FORECAST_HORIZONS,
        "trained_at": datetime.utcnow().isoformat(),
        "train_period": train_period,
        "test_period": test_period,
        "xgboost_available": XGBOOST_AVAILABLE,
    }
    schema_path = ARTIFACTS_DIR / "model_schema.json"
    with open(schema_path, "w") as f:
        json.dump(schema, f, indent=2)

    eval_path = ARTIFACTS_DIR / "evaluation_results.json"
    with open(eval_path, "w") as f:
        json.dump(all_results, f, indent=2)

    logger.info(f"\n=== Training Complete ===")
    logger.info(f"Best model: {best_model_name}")
    logger.info(f"Schema: {schema_path}")
    logger.info(f"Evaluation: {eval_path}")

    return all_results


if __name__ == "__main__":
    train()
