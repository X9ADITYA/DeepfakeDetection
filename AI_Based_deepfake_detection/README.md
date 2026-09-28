# Deepfake Forensics Platform

A full-stack application for analyzing likely manipulated images and videos. The current project includes the full app flow from upload to analysis to results, with a backend inference scaffold, a live-processing UI, and scan history persistence.

This project is now beyond a pure scaffold. The app has working frontend/backend wiring, a progress-tracking flow, and a backend model loader that is ready for a real pretrained deepfake model. The next critical step is to replace the fallback heuristic with a trained real/fake classifier and validate it on a labeled dataset.

## Current status

Implemented so far:

- Frontend app flow: landing, upload, processing, results, and history
- React + Vite + TypeScript UI with light/dark theming
- FastAPI backend with health, metadata, prediction, status, and history routes
- Session-based scan history handling
- Progress/job tracking for live processing updates
- Face extraction and sampled frame analysis pipeline
- Heatmap rendering and evidence overlay support
- Model artifact path setup for weights and ONNX export
- Training scaffold for a pretrained timm-based deepfake classifier

Still required before the project is a trustworthy detector:

- real dataset download and labeling
- pretrained backbone fine-tuning for fake-vs-real classification
- validation on a real deepfake dataset
- model export to ONNX and backend integration
- end-to-end testing with real image/video samples

## Features

- Image and video upload workflow
- Face detection and sampled video-frame analysis
- Live processing progress and job status polling
- Real/fake verdict with confidence metrics
- Evidence overlay and heatmap visualization
- Session-scoped scan history in MongoDB or local fallback mode
- Model transparency panel in the frontend
- Light and dark UI themes

## Architecture

```text
React + Vite + TypeScript frontend
        |
        | HTTP / JSON and multipart uploads
        v
FastAPI backend ---- MongoDB history
        |
        +-- OpenCV frame handling and face extraction
        +-- PyTorch/timm pretrained backbone workflow
        +-- ONNX export path for deployment
        +-- Heatmap generation and evidence output
```

## Tech stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- Backend: FastAPI, Uvicorn, Python, OpenCV, PyTorch, timm, ONNX Runtime
- Database: MongoDB
- Deployment: Docker Compose

## Project structure

```text
AI_Based_deepfake_detection/
├── backend/
│   ├── app/
│   │   ├── core/                  # settings and environment config
│   │   ├── models/                # Pydantic schemas
│   │   └── services/              # predictor, history, heatmap, face detection, progress
│   ├── static/
│   │   ├── uploads/               # generated upload storage
│   │   ├── heatmaps/              # generated heatmap images
│   │   └── weights/               # model weights and ONNX exports
│   ├── training/                  # pretrained model training pipeline
│   ├── tests/                     # regression tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── pages/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── .venv/
```

## Local run

### Backend

From the backend folder:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

From the frontend folder:

```powershell
npm install
npm run dev
```

By default the frontend expects the backend at `http://localhost:8000`.

### Build check

```powershell
npm run build
```

## Current API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | service health |
| GET | `/model-metadata` | model and evaluation metadata |
| POST | `/predict` | analyze uploaded media |
| POST | `/predict/start` | start async job and return scan id |
| GET | `/predict/{scan_id}/status` | read processing progress |
| GET | `/predict/{scan_id}/result` | fetch final scan result |
| GET | `/history` | list recent session history |

## Model training status

The repo now contains a real pretrained-model training scaffold in:

- [backend/training/train_deepfake_classifier.py](backend/training/train_deepfake_classifier.py)

This training script:

- uses a pretrained timm backbone such as EfficientNet-B4
- trains a binary real/fake classifier on face crops
- validates the model
- exports the final model to ONNX

This is the next required milestone before the application can be treated as a dependable deepfake detector.

## Dataset requirement for the next milestone

To complete the real detector, the next step is to collect a labeled dataset and train on it.

Recommended initial datasets:

- FaceForensics++
- Celeb-DF v2
- DFDC (later expansion)

The model should be trained on face crops with labels:

- `real`
- `fake`

and then validated with a held-out set.

## Notes

- The backend keeps a heuristic fallback when no real model weights are present, but it is not production-grade forensic inference.
- The app is now ready for real model integration, not just demo flow.
- The final objective is to replace the heuristic path with a validated pretrained backbone and export it to ONNX for runtime inference.

## Next recommended milestone

1. Download and prepare a labeled deepfake dataset
2. Train a pretrained backbone on real/fake face crops
3. Export the trained model to ONNX
4. Replace the heuristic inference path in the backend
5. Validate the full upload → analysis → result → history flow with real data
