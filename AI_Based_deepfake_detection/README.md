# Deepfake Forensics Platform

A full-stack web application for analyzing potentially manipulated images and videos. Upload media, inspect the forensic evidence overlay and confidence score, and review previous scans in the history view.

This application is currently a development scaffold. The backend uses trained model weights when they are available and falls back to a computer-vision heuristic when they are not. Results should not be treated as production-grade forensic conclusions until a trained and validated model is connected.

## Features

- Image and video uploads.
- Face detection and sampled video-frame analysis.
- Real/fake verdict with a confidence score.
- Heatmap evidence overlay for the analyzed frame.
- Live processing stages and scan progress.
- Per-frame scores for videos.
- Session-scoped scan history stored in MongoDB.
- Model transparency metadata in the frontend.
- Light and dark themes.

## Architecture

```text
React + Vite + TypeScript frontend
				|
				| HTTP / JSON and multipart uploads
				v
FastAPI inference backend ---- MongoDB scan history
				|
				+-- OpenCV face/frame processing
				+-- PyTorch/timm model or ONNX Runtime
				+-- Heatmap generation
```

## Technology stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts.
- Backend: FastAPI, Uvicorn, Python 3.11, OpenCV, PyTorch, `timm`, FaceNet-PyTorch, Grad-CAM, ONNX Runtime.
- Database: MongoDB 7.
- Deployment: Docker Compose.

## Project structure

```text
AI_Based_deepfake_detection/
├── backend/
│   ├── app/
│   │   ├── core/                 # Settings and environment configuration
│   │   ├── models/               # Pydantic request/response schemas
│   │   └── services/             # Prediction, face detection, heatmaps, history
│   ├── static/uploads/           # Uploaded media (created at runtime)
│   ├── static/heatmaps/          # Generated evidence images (created at runtime)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Shared UI components
│   │   ├── context/              # Scan and theme state
│   │   ├── lib/                  # API, session, types, and mock helpers
│   │   └── pages/                # Landing, upload, processing, results, history
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Run with Docker

From this directory, run:

```powershell
docker compose up --build
```

Open the frontend at `http://localhost:5173` and the API at `http://localhost:8000`. The FastAPI interactive documentation is available at `http://localhost:8000/docs`.

Stop the services with:

```powershell
docker compose down
```

MongoDB data is stored in the `mongo_data` Docker volume. Remove it only when you intentionally want to delete scan history:

```powershell
docker compose down -v
```

## Run locally

### Backend

Requires Python 3.11 or newer. From `backend/`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The local backend expects MongoDB at `mongodb://localhost:27017` by default. Start MongoDB separately, or use the MongoDB service from Docker Compose.

### Frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

The frontend uses `http://localhost:8000` by default. Set `VITE_API_BASE_URL` before starting Vite to use another backend URL:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:8000"
npm run dev
```

Other frontend commands:

```powershell
npm run build
npm run preview
```

## Configuration

Backend settings can be supplied through environment variables or a `.env` file in `backend/`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `deepfake_scans` | MongoDB database name |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `MODEL_BACKBONE` | `efficientnet_b4` | `timm` model name |
| `CONFIDENCE_THRESHOLD` | `0.5` | Fake verdict threshold |

Docker Compose sets the MongoDB connection and CORS origin for the container network.

## Model weights

The backend looks for optional weights under `backend/static/weights/`:

- `efficientnet_b4.pt` for the PyTorch path.
- `efficientnet_b4.onnx` for the ONNX Runtime fallback.

When no compatible weights are present, the predictor uses its OpenCV-based heuristic adapter and includes a note in the result. The configured transparency metadata currently describes EfficientNet-B4, FaceForensics++, and Celeb-DF v2; these values should be updated when the final trained model is selected.

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/model-metadata` | Model and evaluation metadata |
| `POST` | `/predict` | Analyze an uploaded image or video using `file` multipart data |
| `GET` | `/predict/{scan_id}/status` | Read processing progress for a scan |
| `GET` | `/history` | List recent scans for the current `X-Session-Id` |

The prediction and history routes accept an optional `X-Session-Id` header. The frontend creates and reuses this identifier to keep browser history scoped to one session.

## Development notes

- Video files are sampled at up to eight frames rather than analyzed frame by frame.
- Uploaded files and generated heatmaps are written to `backend/static/`.
- The model adapter is intentionally replaceable; connect validated weights before using this system for real decisions.
