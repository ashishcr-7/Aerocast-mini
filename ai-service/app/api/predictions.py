from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import logging

from app.models import predict as predict_module

logger = logging.getLogger(__name__)
router = APIRouter()


class WeatherPoint(BaseModel):
    timestamp: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    precipitation: Optional[float] = None
    pressure: Optional[float] = None
    boundary_layer_height: Optional[float] = None


class ObservationPoint(BaseModel):
    timestamp: str
    value: float


class PredictRequest(BaseModel):
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    forecast_hours: int = 72
    issued_at: str
    recent_pm25: list[ObservationPoint] = []
    weather_data: list[WeatherPoint] = []

    @field_validator("forecast_hours")
    @classmethod
    def validate_hours(cls, v):
        if not (1 <= v <= 72):
            raise ValueError("forecast_hours must be between 1 and 72")
        return v


class ForecastPoint(BaseModel):
    lead_hours: int
    forecast_time: str
    predicted_pm25: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    data_quality: str


class PredictResponse(BaseModel):
    station_id: str
    issued_at: str
    model_version: str
    forecast_hours: int
    data_quality_summary: str
    forecasts: list[ForecastPoint]


@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    if not predict_module.MODEL_LOADED:
        try:
            predict_module.load_model()
        except Exception as e:
            logger.error(f"Failed to auto-load model: {e}")
            raise HTTPException(
                status_code=503,
                detail="Model not yet trained. Run: python scripts/backfill_data.py && python scripts/prepare_dataset.py && python -m app.models.train"
            )

    try:
        result = predict_module.predict_72h(
            station_id=request.station_id,
            issued_at=request.issued_at,
            recent_pm25=[{"timestamp": o.timestamp, "value": o.value} for o in request.recent_pm25],
            weather_data=[w.model_dump() for w in request.weather_data],
            forecast_hours=request.forecast_hours,
        )
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
