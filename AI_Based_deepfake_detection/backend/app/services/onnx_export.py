from __future__ import annotations

from pathlib import Path


def export_backbone_to_onnx(model: object, output_path: Path, input_size: tuple[int, int, int, int] = (1, 3, 224, 224)) -> Path:
    try:
        import torch
    except Exception as exc:  # pragma: no cover - import guard
        raise RuntimeError("PyTorch is required for ONNX export") from exc

    output_path.parent.mkdir(parents=True, exist_ok=True)
    dummy_input = torch.randn(*input_size)
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=["input"],
        output_names=["logits"],
        opset_version=17,
        dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}},
    )
    return output_path
