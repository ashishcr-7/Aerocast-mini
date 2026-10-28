"""
Delhi NCR Air Pollution Forecasting System — FastAPI AI Service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.health import router as health_router
from app.api.predictions import router as predictions_router
from app.api.metrics import router as metrics_router
from app.models.predict import load_model

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    logger.info("Loading ML model artifacts...")
    try:
        load_model()
        logger.info("✅ Model loaded successfully")
    except FileNotFoundError:
        logger.warning("⚠️  No trained model found — /predict will return 503 until model is trained")
    except Exception as e:
        logger.error(f"❌ Model load failed: {e}")
    yield
    logger.info("AI service shutting down")


app = FastAPI(
    title="Delhi NCR Air Pollution Forecasting AI Service",
    description="ML-powered PM2.5 forecasting for 72-hour horizons",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Delhi NCR Air Pollution Forecasting AI Service",
        "status": "online",
        "documentation": "/docs",
        "frontend": "http://localhost:5173",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "metrics": "/metrics",
        },
    }

app.include_router(health_router)
app.include_router(predictions_router)
app.include_router(metrics_router)
