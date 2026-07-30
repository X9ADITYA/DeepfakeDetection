from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class Verdict(str, Enum):
    REAL = "real"
    FAKE = "fake"


class MediaKind(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class ScanRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    session_id: str | None = None
    media_type: MediaKind
    filename: str
    verdict: Verdict
    confidence: float
    heatmap_url: str
    created_at: datetime
    per_frame_scores: list[float] = Field(default_factory=list)
    analysis_notes: list[str] = Field(default_factory=list)


class PredictResponse(ScanRecord):
    pipeline_stages: list[str] = Field(default_factory=list)
    frame_count: int = 1


class ModelTransparency(BaseModel):
    backbone: str
    training_dataset: str
    evaluation_dataset: str
    cross_dataset_auc: float
    confidence_threshold: float
    notes: list[str] = Field(default_factory=list)
