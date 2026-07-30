from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import Settings, get_settings, settings
from .models.schemas import ModelTransparency, PredictResponse, ScanRecord
from .services.history_repository import HistoryRepository
from .services.predictor import DeepfakePredictor

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

app.mount("/static", StaticFiles(directory=str(settings.static_root)), name="static")

predictor = DeepfakePredictor(settings)
history_repository = HistoryRepository(settings)


@app.on_event("startup")
async def on_startup() -> None:
    settings.static_root.mkdir(parents=True, exist_ok=True)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.heatmaps_dir.mkdir(parents=True, exist_ok=True)
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


@app.get("/history", response_model=list[ScanRecord])
async def history(limit: int = 50, x_session_id: str | None = Header(default=None, alias="X-Session-Id")) -> list[ScanRecord]:
    return await history_repository.list_recent(limit=limit, session_id=x_session_id)
