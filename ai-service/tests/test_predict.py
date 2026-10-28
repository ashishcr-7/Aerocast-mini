import unittest
from datetime import datetime, timezone
from app.models.predict import load_model, predict_72h, get_model_info


class TestPrediction(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_model()

    def test_model_loaded_and_info(self):
        info = get_model_info()
        self.assertIsInstance(info, dict)
        self.assertEqual(info["status"], "loaded")
        self.assertIn("model_name", info)
        self.assertIn("feature_count", info)
        self.assertGreater(info["feature_count"], 0)

    def test_predict_72h_shape_and_bounds(self):
        now_iso = datetime.now(timezone.utc).isoformat()
        recent_pm25 = [
            {"timestamp": f"2026-10-24T{h:02d}:00:00Z", "value": 120.0 + (h % 10)}
            for h in range(12)
        ]
        weather_data = [
            {
                "timestamp": f"2026-10-25T{h:02d}:00:00Z",
                "temperature": 22.0,
                "humidity": 60.0,
                "windSpeed": 8.0,
                "windDirection": 300.0,
                "precipitation": 0.0,
                "pressure": 1012.0,
                "boundaryLayerHeight": 450.0,
            }
            for h in range(24)
        ]

        result = predict_72h(
            station_id="test-station-1",
            issued_at=now_iso,
            recent_pm25=recent_pm25,
            weather_data=weather_data,
            forecast_hours=72,
        )

        self.assertIsInstance(result, dict)
        self.assertIn("forecasts", result)
        forecasts = result["forecasts"]
        self.assertEqual(len(forecasts), 72)

        for p in forecasts:
            self.assertIn("lead_hours", p)
            self.assertTrue(1 <= p["lead_hours"] <= 72)
            self.assertIn("predicted_pm25", p)
            self.assertGreater(p["predicted_pm25"], 0)
            self.assertIn("lower_bound", p)
            self.assertIn("upper_bound", p)
            self.assertTrue(p["lower_bound"] <= p["predicted_pm25"] <= p["upper_bound"])

        self.assertIn("model_version", result)


if __name__ == "__main__":
    unittest.main()
