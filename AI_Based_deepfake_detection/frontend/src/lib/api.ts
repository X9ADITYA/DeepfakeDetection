import type { ModelTransparency, PredictionStatus, ScanResult } from './types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

function normalizeScan(scan: ScanResult): ScanResult {
  return {
    ...scan,
    heatmap_url: scan.heatmap_url.startsWith('http') ? scan.heatmap_url : `${API_BASE}${scan.heatmap_url}`,
  };
}

export async function startPrediction(file: File, sessionId: string): Promise<{ id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/predict/start`, {
    method: 'POST',
    headers: {
      'X-Session-Id': sessionId,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Prediction start failed with status ${response.status}`);
  }

  return response.json() as Promise<{ id: string; status: string }>;
}

export async function fetchPredictionStatus(scanId: string): Promise<PredictionStatus> {
  const response = await fetch(`${API_BASE}/predict/${scanId}/status`);
  if (!response.ok) {
    throw new Error(`Status request failed with status ${response.status}`);
  }
  return response.json() as Promise<PredictionStatus>;
}

export async function fetchPredictionResult(scanId: string): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/predict/${scanId}/result`);
  if (!response.ok) {
    throw new Error(`Result request failed with status ${response.status}`);
  }
  return normalizeScan((await response.json()) as ScanResult);
}

export async function predictMedia(file: File, sessionId: string): Promise<ScanResult> {
  const job = await startPrediction(file, sessionId);
  let status = await fetchPredictionStatus(job.id);

  while ((status.status === 'queued' || status.status === 'processing') && status.progress < 100) {
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    status = await fetchPredictionStatus(job.id);
  }

  if (status.status !== 'complete' || !status.result) {
    throw new Error('Prediction did not complete successfully');
  }

  return normalizeScan(status.result as ScanResult);
}

export async function fetchModelTransparency(): Promise<ModelTransparency> {
  const response = await fetch(`${API_BASE}/model-metadata`);

  if (!response.ok) {
    throw new Error(`Model metadata request failed with status ${response.status}`);
  }

  return response.json() as Promise<ModelTransparency>;
}

export async function fetchHistory(sessionId: string): Promise<ScanResult[]> {
  const response = await fetch(`${API_BASE}/history`, {
    headers: {
      'X-Session-Id': sessionId,
    },
  });

  if (!response.ok) {
    throw new Error(`History request failed with status ${response.status}`);
  }

  const scans = (await response.json()) as ScanResult[];
  return scans.map(normalizeScan);
}
