from fastapi import APIRouter
from app.models.evaluate import load_evaluation_results

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    results = load_evaluation_results()
    if not results:
        return {
            "status": "no_metrics",
            "message": "No evaluation results found. Train the model first.",
            "models": [],
        }
    return {"status": "ok", "models": results}
