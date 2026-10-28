import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone

from app.data.features import build_features, get_feature_columns


class TestFeatures(unittest.TestCase):
    def test_feature_columns_schema(self):
        cols = get_feature_columns()
        self.assertIsInstance(cols, list)
        self.assertGreaterEqual(len(cols), 20)
        self.assertIn("temperature", cols)
        self.assertIn("humidity", cols)
        self.assertIn("wind_speed", cols)
        self.assertIn("pbl_height", cols)
        self.assertIn("pm25_lag_1h", cols)
        self.assertIn("pm25_lag_24h", cols)
        self.assertIn("pm25_roll_mean_24h", cols)
        self.assertIn("hour_sin", cols)
        self.assertIn("hour_cos", cols)

    def test_build_features_no_leakage(self):
        start = datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc)
        dates = [start + timedelta(hours=i) for i in range(120)]

        weather_df = pd.DataFrame({
            "temperature": np.random.uniform(15, 30, len(dates)),
            "humidity": np.random.uniform(30, 80, len(dates)),
            "windSpeed": np.random.uniform(2, 20, len(dates)),
            "windDirection": np.random.uniform(0, 360, len(dates)),
            "precipitation": np.zeros(len(dates)),
            "pressure": np.random.uniform(1010, 1020, len(dates)),
            "boundaryLayerHeight": np.random.uniform(200, 1800, len(dates)),
        }, index=pd.DatetimeIndex(dates, name="timestamp"))

        pm25_df = pd.DataFrame({
            "pm25": np.random.uniform(40, 200, len(dates)),
        }, index=pd.DatetimeIndex(dates, name="timestamp"))

        features = build_features(weather_df, pm25_df)

        self.assertFalse(features.empty)
        self.assertIn("pm25_lag_1h", features.columns)
        self.assertIn("pm25_lag_24h", features.columns)
        self.assertIn("pm25_roll_mean_6h", features.columns)

        idx = 10
        current_time = features.index[idx]
        prev_time = current_time - timedelta(hours=1)
        expected_lag1 = pm25_df.loc[prev_time, "pm25"]
        actual_lag1 = features.loc[current_time, "pm25_lag_1h"]
        self.assertTrue(np.isclose(expected_lag1, actual_lag1))


if __name__ == "__main__":
    unittest.main()
