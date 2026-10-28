from fastapi import APIRouter
import platform
from app.models.predict import get_model_info

router = APIRouter()

@router.get("/health")
async def health():
    model_info = get_model_info()
    return {
        "status": "ok",
        "service": "Delhi NCR Air Pollution AI Service",
        "version": "1.0.0",
        "python": platform.python_version(),
        "model": model_info,
    }
