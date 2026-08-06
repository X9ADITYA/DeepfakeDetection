from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np


class HeatmapBuilder:
    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def build(self, frame: np.ndarray, box: tuple[int, int, int, int] | None, cam_mask: np.ndarray | None = None) -> tuple[str, str]:
        if frame is None or frame.size == 0:
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)

        height, width = frame.shape[:2]

        if cam_mask is None:
            heat = np.zeros((height, width), dtype=np.uint8)
            if box is None:
                center = (width // 2, height // 2)
                axes = (max(40, width // 4), max(40, height // 4))
                cv2.ellipse(heat, center, axes, 0, 0, 360, 255, -1)
            else:
                x1, y1, x2, y2 = box
                cv2.rectangle(heat, (x1, y1), (x2, y2), 255, thickness=-1)

            heat = cv2.GaussianBlur(heat, (0, 0), sigmaX=max(18, min(width, height) // 18))
            heat = cv2.normalize(heat, None, 0, 255, cv2.NORM_MINMAX)
        else:
            try:
                mask = cam_mask.astype('float32')
                if mask.ndim == 2:
                    mask_resized = cv2.resize(mask, (width, height))
                else:
                    mask_resized = cv2.resize(mask[..., 0], (width, height))

                heat = np.clip((mask_resized * 255.0), 0, 255).astype(np.uint8)
                heat = cv2.GaussianBlur(heat, (11, 11), sigmaX=max(8, min(width, height) // 80))
                heat = cv2.normalize(heat, None, 0, 255, cv2.NORM_MINMAX)
            except Exception:
                heat = np.zeros((height, width), dtype=np.uint8)

        colorized = cv2.applyColorMap(heat, cv2.COLORMAP_TURBO)
        overlay = cv2.addWeighted(frame, 0.72, colorized, 0.28, 0)

        filename = f"heatmap-{uuid4().hex}.jpg"
        file_path = self.output_dir / filename
        cv2.imwrite(str(file_path), overlay)
        return f"/static/heatmaps/{filename}", str(file_path)
