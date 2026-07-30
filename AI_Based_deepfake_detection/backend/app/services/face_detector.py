from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np


@dataclass
class FaceCropResult:
    frame: np.ndarray
    box: tuple[int, int, int, int] | None


class FaceDetector:
    def __init__(self) -> None:
        self._detector = self._build_detector()

    def _build_detector(self):
        try:
            from facenet_pytorch import MTCNN
        except Exception:
            return None
        return MTCNN(keep_all=False, device="cpu")

    def crop(self, frame: np.ndarray) -> FaceCropResult:
        if frame is None or frame.size == 0:
            raise ValueError("Frame data is empty")

        if self._detector is not None:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            boxes, _ = self._detector.detect(rgb_frame)
            if boxes is not None and len(boxes) > 0:
                x1, y1, x2, y2 = [int(value) for value in boxes[0]]
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(frame.shape[1], x2)
                y2 = min(frame.shape[0], y2)
                if x2 > x1 and y2 > y1:
                    return FaceCropResult(frame=frame[y1:y2, x1:x2], box=(x1, y1, x2, y2))

        height, width = frame.shape[:2]
        crop_size = int(min(height, width) * 0.72)
        left = max(0, (width - crop_size) // 2)
        top = max(0, (height - crop_size) // 2)
        right = min(width, left + crop_size)
        bottom = min(height, top + crop_size)
        return FaceCropResult(frame=frame[top:bottom, left:right], box=(left, top, right, bottom))
