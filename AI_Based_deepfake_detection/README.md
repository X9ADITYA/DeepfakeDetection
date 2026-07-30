# Deepfake Detection Platform

A full-stack deepfake video-first detector with a secondary single-image path that reuses the same forensic pipeline on a still frame.

## Product scope

- Upload a video or image.
- See a live analyzing state with face detection, score movement, and pipeline logs.
- Get a verdict, confidence score, and branded evidence overlay.
- Review scan history backed by MongoDB.

## Stack

- Frontend: Vite, React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts.
- Backend: FastAPI, PyTorch, OpenCV, MTCNN, Grad-CAM, ONNX export path.
- Database: MongoDB.
- Deployment: Docker from day one for both services.

## Current scaffold

This repository is set up as a monorepo with:

- `frontend/` for the Vite SPA.
- `backend/` for the FastAPI inference service.
- `docker-compose.yml` for local service orchestration.

## Design direction

### Token system

Light mode:

- Background: `#F5F7FB`
- Surface: `#FFFFFF`
- Surface alt: `#EEF2F7`
- Border: `#D9E2EF`
- Text: `#0F172A`
- Muted text: `#64748B`
- Accent: `#4156F6`
- Accent soft: `#DCE3FF`

Dark mode:

- Background: `#060912`
- Surface: `#0D1420`
- Surface alt: `#121B2D`
- Border: `#233044`
- Text: `#E8EEF8`
- Muted text: `#93A4BC`
- Glow blue: `#3B82F6`
- Glow teal: `#14B8A6`
- Glow violet: `#7C6CFF`

Typography:

- Display: `Fraunces`
- Body: `IBM Plex Sans`
- Mono: `IBM Plex Mono`

Signature visual element:

- A branded evidence overlay for the heatmap layer, designed to look like a forensic annotation rather than a generic red Grad-CAM blob.

### Analyzing screen plan

The processing view will combine four live panels:

- The active frame with a bounding box and evidence overlay.
- A confidence gauge that updates during the scan.
- A frame progression / waveform strip.
- A pipeline log that shows each stage of the analysis.

## Model choice for v1

- Backbone: EfficientNet-B4.
- Training set: FaceForensics++.
- Generalization eval target: Celeb-DF v2.

The backend exposes the model metadata so the frontend can surface the training and cross-dataset result in the Model Transparency panel.

## Local run targets

The repo does not have dependencies installed yet. After the scaffold is in place:

- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && python -m venv .venv && .venv\\Scripts\\activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
- Docker: `docker compose up --build`
