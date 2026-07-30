from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from ..core.config import Settings
from ..models.schemas import PredictResponse, ScanRecord


class HistoryRepository:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client: AsyncIOMotorClient | None = None
        self._collection = None
        self._fallback_documents: list[dict[str, Any]] = []

    async def connect(self) -> None:
        try:
            self._client = AsyncIOMotorClient(self.settings.mongo_uri)
            database = self._client[self.settings.mongo_db]
            self._collection = database["scan_history"]
            await self._collection.create_index([("session_id", 1), ("created_at", -1)])
        except Exception:
            self._collection = None

    async def store(self, scan: PredictResponse) -> None:
        document = scan.model_dump(by_alias=True)
        if self._collection is not None:
            await self._collection.insert_one(document)
            return
        self._fallback_documents.append(document)

    async def list_recent(self, limit: int = 50, session_id: str | None = None) -> list[ScanRecord]:
        if self._collection is not None:
            query: dict[str, object] = {}
            if session_id is not None:
                query["session_id"] = session_id
            cursor = self._collection.find(query).sort("created_at", -1).limit(limit)
            documents = await cursor.to_list(length=limit)
            return [ScanRecord.model_validate(document) for document in documents]

        documents = [document for document in self._fallback_documents if session_id is None or document.get("session_id") == session_id]
        documents = list(reversed(documents[-limit:]))
        return [ScanRecord.model_validate(document) for document in documents]
