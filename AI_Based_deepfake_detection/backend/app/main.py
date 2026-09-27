from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import Settings, get_settings, settings
from .models.schemas import ModelTransparency, PredictResponse, ScanRecord
from .services.history_repository import HistoryRepository
from .services.predictor import DeepfakePredictor
from .services.progress import progress_manager

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.static_root.mkdir(parents=True, exist_ok=True)
settings.uploads_dir.mkdir(parents=True, exist_ok=True)
settings.heatmaps_dir.mkdir(parents=True, exist_ok=True)
settings.weights_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(settings.static_root)), name="static")

predictor = DeepfakePredictor(settings)
history_repository = HistoryRepository(settings)


@app.on_event("startup")
async def on_startup() -> None:
    settings.static_root.mkdir(parents=True, exist_ok=True)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.heatmaps_dir.mkdir(parents=True, exist_ok=True)
    settings.weights_dir.mkdir(parents=True, exist_ok=True)
    await history_repository.connect()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/model-metadata", response_model=ModelTransparency)
async def model_metadata() -> ModelTransparency:
    return ModelTransparency(**settings.model_metadata)


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...), x_session_id: str | None = Header(default=None, alias="X-Session-Id")) -> PredictResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file name is required")

    result = await predictor.predict(file, session_id=x_session_id)
    await history_repository.store(result)
    return result


@app.post("/predict/start")
async def predict_start(file: UploadFile = File(...), x_session_id: str | None = Header(default=None, alias="X-Session-Id")) -> dict[str, str]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file name is required")

    job_id = file.filename or "scan"
    job_id = f"{job_id}-{__import__('uuid').uuid4().hex}"
    progress_manager.init(job_id, stage="Queued")

    async def _run_job() -> None:
        try:
            progress_manager.update(job_id, status="processing", stage_index=0, stage="Uploading media", progress=5)
            result = await predictor.predict(file, session_id=x_session_id)
            progress_manager.set_result(job_id, result.model_dump())
            await history_repository.store(result)
        except Exception as exc:  # pragma: no cover - best effort guard
            progress_manager.update(job_id, status="failed", stage="Error", progress=100, details={"error": str(exc)})

    asyncio.create_task(_run_job())
    return {"id": job_id, "status": "queued"}


@app.get("/history", response_model=list[ScanRecord])
async def history(limit: int = 50, x_session_id: str | None = Header(default=None, alias="X-Session-Id")) -> list[ScanRecord]:
    return await history_repository.list_recent(limit=limit, session_id=x_session_id)


@app.get("/predict/{scan_id}/status")
async def predict_status(scan_id: str):
    status = progress_manager.get(scan_id)
    if not status:
        return {"status": "not_found"}
    return {
        "id": status.id,
        "status": status.status,
        "stage_index": status.stage_index,
        "stage": status.stage,
        "progress": status.progress,
        "last_updated": status.last_updated.isoformat(),
        "details": status.details,
        "result": status.result,
    }


@app.get("/predict/{scan_id}/result")
async def predict_result(scan_id: str):
    status = progress_manager.get(scan_id)
    if not status:
        raise HTTPException(status_code=404, detail="Prediction not found")
    if status.status != "complete":
        raise HTTPException(status_code=202, detail="Prediction still processing")
    return status.result
