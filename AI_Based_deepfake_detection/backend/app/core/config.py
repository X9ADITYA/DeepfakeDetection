from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Deepfake Forensics API"
    api_prefix: str = "/api/v1"
    mongo_uri: str = Field(default="mongodb://localhost:27017")
    mongo_db: str = Field(default="deepfake_scans")
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    static_root: Path = Path("static")
    uploads_dir: Path = Path("static/uploads")
    heatmaps_dir: Path = Path("static/heatmaps")
    model_backbone: str = "efficientnet-b4"
    training_dataset: str = "FaceForensics++"
    evaluation_dataset: str = "Celeb-DF v2"
    cross_dataset_auc: float = 0.72
    confidence_threshold: float = 0.5

    @property
    def model_metadata(self) -> dict[str, object]:
        return {
            "backbone": self.model_backbone,
            "training_dataset": self.training_dataset,
            "evaluation_dataset": self.evaluation_dataset,
            "cross_dataset_auc": self.cross_dataset_auc,
            "confidence_threshold": self.confidence_threshold,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
