from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ProgressStatus:
    id: str
    stage_index: int = 0
    stage: str | None = None
    progress: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    details: dict[str, Any] = field(default_factory=dict)


class ProgressManager:
    def __init__(self) -> None:
        self._store: dict[str, ProgressStatus] = {}

    def init(self, id: str, stage: str | None = None) -> ProgressStatus:
        ps = ProgressStatus(id=id, stage=stage, progress=0)
        self._store[id] = ps
        return ps

    def update(self, id: str, *, stage_index: int | None = None, stage: str | None = None, progress: int | None = None, details: dict | None = None) -> ProgressStatus | None:
        ps = self._store.get(id)
        if not ps:
            return None
        if stage_index is not None:
            ps.stage_index = stage_index
        if stage is not None:
            ps.stage = stage
        if progress is not None:
            ps.progress = progress
        if details is not None:
            ps.details.update(details)
        ps.last_updated = datetime.utcnow()
        return ps

    def get(self, id: str) -> ProgressStatus | None:
        return self._store.get(id)


progress_manager = ProgressManager()
