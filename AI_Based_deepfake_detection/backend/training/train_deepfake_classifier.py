from __future__ import annotations

import argparse
import os
from pathlib import Path

import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

try:
    import timm
except Exception as exc:  # pragma: no cover - import guard for runtime environment
    raise RuntimeError("timm is required for pretrained backbone training") from exc


DEFAULT_MODEL = "efficientnet_b4"


class DeepfakeDataset(Dataset):
    def __init__(self, root_dir: str | Path, image_size: int = 224, is_train: bool = True) -> None:
        self.root = Path(root_dir)
        self.image_size = image_size
        self.classes = ["real", "fake"]
        self.samples: list[tuple[Path, int]] = []

        for label_index, class_name in enumerate(self.classes):
            class_dir = self.root / class_name
            if not class_dir.exists():
                continue
            for image_path in sorted(class_dir.iterdir()):
                if image_path.is_file() and image_path.suffix.lower() in {".png", ".jpg", ".jpeg", ".bmp", ".webp"}:
                    self.samples.append((image_path, label_index))

        if not self.samples:
            raise FileNotFoundError(
                f"No image samples were found under {self.root}. Expected folders: {self.root / 'real'} and {self.root / 'fake'}"
            )

        self.transform = self._build_transform(is_train)

    def _build_transform(self, is_train: bool) -> T.Compose:
        ops: list = [
            T.Resize((self.image_size, self.image_size)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
        if is_train:
            ops.insert(1, T.RandomHorizontalFlip(p=0.5))
            ops.insert(1, T.RandomRotation(10))
        return T.Compose(ops)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        image_path, label = self.samples[index]
        image = Image.open(image_path).convert("RGB")
        image = self.transform(image)
        return image, label


def build_dataloaders(train_dir: str | Path, val_dir: str | Path, batch_size: int = 8, image_size: int = 224) -> tuple[DataLoader, DataLoader]:
    train_dataset = DeepfakeDataset(train_dir, image_size=image_size, is_train=True)
    val_dataset = DeepfakeDataset(val_dir, image_size=image_size, is_train=False)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=torch.cuda.is_available())
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=torch.cuda.is_available())
    return train_loader, val_loader


def create_model(model_name: str = DEFAULT_MODEL, pretrained: bool = True, num_classes: int = 2) -> nn.Module:
    model = timm.create_model(model_name, pretrained=pretrained, num_classes=num_classes)
    return model


def evaluate_model(model: nn.Module, loader: DataLoader, device: torch.device) -> tuple[float, float]:
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    criterion = nn.CrossEntropyLoss()

    with torch.no_grad():
        for inputs, labels in loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            logits = model(inputs)
            loss = criterion(logits, labels)
            total_loss += loss.item() * inputs.size(0)
            predictions = logits.argmax(dim=1)
            correct += (predictions == labels).sum().item()
            total += labels.size(0)

    accuracy = correct / max(1, total)
    return accuracy, total_loss / max(1, total)


def train_model(
    train_dir: str | Path,
    val_dir: str | Path,
    output_dir: str | Path,
    model_name: str = DEFAULT_MODEL,
    batch_size: int = 8,
    epochs: int = 5,
    learning_rate: float = 1e-4,
    weight_decay: float = 1e-4,
    image_size: int = 224,
    pretrained: bool = True,
) -> Path:
    train_loader, val_loader = build_dataloaders(train_dir, val_dir, batch_size=batch_size, image_size=image_size)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = create_model(model_name=model_name, pretrained=pretrained, num_classes=2)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)

    best_accuracy = -1.0
    best_state = None
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0

        for inputs, labels in tqdm(train_loader, desc=f"Epoch {epoch + 1}/{epochs}"):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(inputs)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * inputs.size(0)

        epoch_loss = running_loss / max(1, len(train_loader.dataset))
        val_accuracy, val_loss = evaluate_model(model, val_loader, device)
        print(f"Epoch {epoch + 1}/{epochs} - train_loss={epoch_loss:.4f} - val_accuracy={val_accuracy:.4f} - val_loss={val_loss:.4f}")

        if val_accuracy > best_accuracy:
            best_accuracy = val_accuracy
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    if best_state is not None:
        torch.save(best_state, output_dir / f"{model_name}_best.pt")
        model.load_state_dict(best_state)

    export_path = output_dir / f"{model_name}.onnx"
    dummy_input = torch.randn(1, 3, image_size, image_size, device=device)
    torch.onnx.export(
        model,
        dummy_input,
        export_path,
        input_names=["input"],
        output_names=["logits"],
        opset_version=17,
        dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}},
    )

    return export_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a pretrained deepfake classifier using timm and export to ONNX.")
    parser.add_argument("--train-dir", required=True, help="Directory containing real/ and fake/ image folders for training data")
    parser.add_argument("--val-dir", required=True, help="Directory containing real/ and fake/ image folders for validation data")
    parser.add_argument("--output-dir", default="./trained_models", help="Where to save model weights and ONNX export")
    parser.add_argument("--model-name", default=DEFAULT_MODEL, help="timm pretrained model name")
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--no-pretrained", action="store_true", help="Disable pretrained weights for debugging")
    args = parser.parse_args()

    export_path = train_model(
        train_dir=args.train_dir,
        val_dir=args.val_dir,
        output_dir=args.output_dir,
        model_name=args.model_name,
        batch_size=args.batch_size,
        epochs=args.epochs,
        learning_rate=args.lr,
        image_size=args.image_size,
        pretrained=not args.no_pretrained,
    )
    print(f"Saved model export to: {export_path}")


if __name__ == "__main__":
    main()
