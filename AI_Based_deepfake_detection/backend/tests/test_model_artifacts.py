from pathlib import Path

from app.core.config import Settings


def test_settings_exposes_weights_dir() -> None:
    weights_dir = Path("/tmp/test-weights")
    settings = Settings(_env_file=None, weights_dir=weights_dir)
    assert settings.weights_dir == weights_dir
