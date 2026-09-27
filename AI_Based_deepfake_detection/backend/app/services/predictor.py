from __future__ import annotations

import math
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np
from fastapi import UploadFile

from ..core.config import Settings
from ..models.schemas import MediaKind, PredictResponse, Verdict
from .face_detector import FaceDetector
from .heatmap import HeatmapBuilder
from .progress import progress_manager


class BackboneInferencer:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model = None
        self.onnx_session = None
        self.model = self._load_model()

    def _load_model(self):
        try:
            import torch
            import timm
        except Exception:
            # try ONNX runtime fallback
            try:
                import onnxruntime as ort
            except Exception:
                return None
            onnx_path = self.settings.weights_dir / f"{self.settings.model_backbone}.onnx"
            if onnx_path.exists():
                self.onnx_session = ort.InferenceSession(str(onnx_path))
                return None
            return None

        model = timm.create_model(self.settings.model_backbone, pretrained=False, num_classes=1)
        weights_path = self.settings.weights_dir / f"{self.settings.model_backbone}.pt"
        if weights_path.exists():
            state_dict = torch.load(weights_path, map_location="cpu")
            model.load_state_dict(state_dict)
        model.eval()
        return model

    def score(self, frame: np.ndarray) -> float:
        if frame is None or frame.size == 0:
            return 0.5

        if self.model is not None:
            try:
                import torch
                from torchvision import transforms
            except Exception:
                return self._heuristic_score(frame)

            resized = cv2.cvtColor(cv2.resize(frame, (224, 224)), cv2.COLOR_BGR2RGB)
            tensor = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])(resized).unsqueeze(0)
            with torch.no_grad():
                logits = self.model(tensor)
                probability = torch.sigmoid(logits).item()
            return float(probability)
        # ONNX fallback
        if self.onnx_session is not None:
            try:
                import numpy as _np
                resized = cv2.cvtColor(cv2.resize(frame, (224, 224)), cv2.COLOR_BGR2RGB).astype(_np.float32) / 255.0
                mean = _np.array([0.485, 0.456, 0.406], dtype=_np.float32)
                std = _np.array([0.229, 0.224, 0.225], dtype=_np.float32)
                tensor = (resized - mean) / std
                tensor = tensor.transpose(2, 0, 1)[None, ...]
                inputs = {self.onnx_session.get_inputs()[0].name: tensor}
                logits = self.onnx_session.run(None, inputs)[0]
                import math as _math
                prob = 1.0 / (1.0 + _math.exp(-float(logits.ravel()[0])))
                return float(prob)
            except Exception:
                return self._heuristic_score(frame)

        return self._heuristic_score(frame)

    def _heuristic_score(self, frame: np.ndarray) -> float:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        edge_density = float(cv2.Canny(gray, 90, 180).mean() / 255.0)
        texture_term = min(1.0, laplacian_variance / 250.0)
        raw_score = texture_term * 0.7 + edge_density * 0.3
        score = 1.0 / (1.0 + math.exp(-((raw_score * 4.0) - 1.6)))
        return float(np.clip(score, 0.01, 0.99))


class DeepfakePredictor:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.face_detector = FaceDetector()
        self.heatmap_builder = HeatmapBuilder(settings.heatmaps_dir)
        self.backbone = BackboneInferencer(settings)
        self.uploads_dir = settings.uploads_dir
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    async def predict(self, upload: UploadFile, session_id: str | None = None) -> PredictResponse:
        upload_id = uuid4().hex
        progress_manager.init(upload_id, stage="Uploading media")
        media_kind = self._media_kind(upload.filename, upload.content_type)
        saved_path = self._save_upload(upload, upload_id)
        progress_manager.update(upload_id, stage_index=0, progress=6, details={"filename": str(saved_path.name)})
        frames = self._extract_frames(saved_path, media_kind)

        per_frame_scores: list[float] = []
        scored_frame = None
        scored_box = None
        for idx, frame in enumerate(frames):
            crop_result = self.face_detector.crop(frame)
            scored_frame = crop_result.frame
            scored_box = crop_result.box
            score = round(self.backbone.score(crop_result.frame), 4)
            per_frame_scores.append(score)
            # update progress per-frame
            progress_pct = int(6 + (idx + 1) * (80.0 / max(1, len(frames))))
            progress_manager.update(upload_id, stage_index=2, stage="Scoring frames", progress=min(95, progress_pct), details={"latest_score": score, "frame_index": idx})

        # attempt Grad-CAM on the most suspicious frame (best score)
        cam_mask = None
        try:
            if self.backbone.model is not None:
                try:
                    import torch
                    from torchvision import transforms
                    from pytorch_grad_cam import GradCAM
                except Exception:
                    GradCAM = None

                if 'GradCAM' in globals() or 'GradCAM' in locals():
                    try:
                        model = self.backbone.model
                        # find a convolutional layer
                        target_layer = None
                        for m in reversed(list(model.modules())):
                            import torch as _torch

                            if isinstance(m, _torch.nn.Conv2d):
                                target_layer = m
                                break
                        if target_layer is not None:
                            from pytorch_grad_cam import GradCAM
                            from pytorch_grad_cam.utils.image import preprocess_image
                            # prepare tensor
                            resized = cv2.cvtColor(cv2.resize(scored_frame, (224, 224)), cv2.COLOR_BGR2RGB)
                            tensor = transforms.Compose([
                                transforms.ToTensor(),
                                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
                            ])(resized).unsqueeze(0)
                            cam = GradCAM(model=model, target_layers=[target_layer], use_cuda=False)
                            grayscale_cam = cam(input_tensor=tensor)
                            cam_mask = grayscale_cam[0]
                    except Exception:
                        cam_mask = None
        except Exception:
            cam_mask = None

        confidence = float(np.mean(per_frame_scores)) if per_frame_scores else 0.5
        verdict = Verdict.FAKE if confidence >= self.settings.confidence_threshold else Verdict.REAL
        heatmap_url, _ = self.heatmap_builder.build(scored_frame if scored_frame is not None else None, scored_box, cam_mask=cam_mask)

        progress_manager.update(upload_id, stage_index=4, stage="Rendering evidence overlay", progress=98, details={"final_confidence": confidence})
        progress_manager.update(upload_id, stage_index=5, stage="Complete", progress=100)

        pipeline_stages = [
            "Uploading media",
            "Detecting face region",
            "Extracting forensic features",
            "Scoring frame consistency",
            "Rendering evidence overlay",
        ]

        return PredictResponse(
            _id=upload_id,
            session_id=session_id,
            media_type=media_kind,
            filename=Path(upload.filename or saved_path.name).name,
            verdict=verdict,
            confidence=round(confidence, 4),
            heatmap_url=heatmap_url,
            created_at=datetime.now(timezone.utc),
            per_frame_scores=per_frame_scores,
            analysis_notes=[
                "This scaffold uses a swap-ready inference adapter until trained weights are connected.",
            ],
            pipeline_stages=pipeline_stages,
            frame_count=len(frames),
        )

    def _media_kind(self, filename: str | None, content_type: str | None) -> MediaKind:
        suffix = Path(filename or "").suffix.lower()
        media_type = content_type or mimetypes.guess_type(filename or "")[0] or ""
        if suffix in {".mp4", ".mov", ".avi", ".mkv", ".webm"} or media_type.startswith("video"):
            return MediaKind.VIDEO
        return MediaKind.IMAGE

    def _save_upload(self, upload: UploadFile, upload_id: str) -> Path:
        extension = Path(upload.filename or "upload.bin").suffix or ".bin"
        destination = self.uploads_dir / f"{upload_id}{extension}"
        with destination.open("wb") as output_stream:
            output_stream.write(upload.file.read())
        upload.file.seek(0)
        return destination

    def _extract_frames(self, file_path: Path, media_kind: MediaKind) -> list[np.ndarray]:
        if media_kind == MediaKind.IMAGE:
            image = cv2.imread(str(file_path))
            return [image] if image is not None else []

        capture = cv2.VideoCapture(str(file_path))
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        sample_indices = self._sample_indices(frame_count)
        frames: list[np.ndarray] = []
        for index in sample_indices:
            capture.set(cv2.CAP_PROP_POS_FRAMES, index)
            success, frame = capture.read()
            if success and frame is not None:
                frames.append(frame)
        capture.release()
        return frames

    def _sample_indices(self, frame_count: int) -> list[int]:
        if frame_count <= 0:
            return [0]
        if frame_count <= 8:
            return list(range(frame_count))
        step = max(1, frame_count // 8)
        return list(range(0, frame_count, step))[:8]
