import cv2
import torch
import numpy as np
from facenet_pytorch import MTCNN
import timm
from torchvision import transforms
import sys
import json

# ---------------- CONFIG ----------------
MODEL_PATH = "models/efficientnet_b7_df.pth"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
FRAME_SKIP = 5
MIN_FRAMES = 10

# ---------------- MODEL ----------------
model = timm.create_model(
    "tf_efficientnet_b7_ns",
    pretrained=False,
    num_classes=1
)

# --------- FIXED CHECKPOINT LOADING ---------
checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=False   # REQUIRED for PyTorch >= 2.6
)

# Some checkpoints store weights under "state_dict"
raw_state = checkpoint["state_dict"] if "state_dict" in checkpoint else checkpoint

new_state = {}
for k, v in raw_state.items():
    # remove DataParallel + encoder wrapper
    if k.startswith("module.encoder."):
        new_key = k.replace("module.encoder.", "")
        new_state[new_key] = v

    # map fc layer to classifier
    elif k.startswith("module.fc."):
        new_key = k.replace("module.fc.", "classifier.")
        new_state[new_key] = v

# load adapted weights
model.load_state_dict(new_state, strict=False)

model.to(DEVICE)
model.eval()

# ---------------- FACE DETECTOR ----------------
mtcnn = MTCNN(
    image_size=224,
    margin=20,
    device=DEVICE
)

# ---------------- TRANSFORMS ----------------
transform = transforms.Normalize(
    mean=[0.485, 0.456, 0.406],
    std=[0.229, 0.224, 0.225]
)


# ---------------- PREDICTION ----------------
def predict_video(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    predictions = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face = mtcnn(rgb)

        if face is None:
            continue

        face = face.unsqueeze(0).to(DEVICE)
        face = transform(face)


        with torch.no_grad():
            prob = torch.sigmoid(model(face)).item()
            predictions.append(prob)

    cap.release()

    if len(predictions) < MIN_FRAMES:
        return {
            "label": "UNCERTAIN",
            "confidence": 0,
            "frames_used": len(predictions)
        }

    avg_prob = float(np.mean(predictions))
    confidence = round(max(avg_prob, 1 - avg_prob) * 100, 2)
    label = "FAKE" if avg_prob > 0.5 else "REAL"

    return {
        "label": label,
        "confidence": confidence,
        "frames_used": len(predictions)
    }

# ---------------- CLI ----------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predictor.py <video_path>")
        sys.exit(1)

    video_path = sys.argv[1]
    result = predict_video(video_path)
    print(json.dumps(result, indent=2))
