from pathlib import Path

from PIL import Image

from training.train_deepfake_classifier import DeepfakeDataset


def test_dataset_builds_for_real_fake_folders(tmp_path: Path) -> None:
    real_dir = tmp_path / "real"
    fake_dir = tmp_path / "fake"
    real_dir.mkdir()
    fake_dir.mkdir()

    for folder, label in [(real_dir, 0), (fake_dir, 1)]:
        image = Image.new("RGB", (32, 32), color=(255, 0, 0) if label == 0 else (0, 0, 255))
        image.save(folder / f"sample_{label}.png")

    dataset = DeepfakeDataset(tmp_path, image_size=32, is_train=False)
    assert len(dataset) == 2
    sample_tensor, sample_label = dataset[0]
    assert sample_tensor.shape[0] == 3
    assert sample_label in {0, 1}
