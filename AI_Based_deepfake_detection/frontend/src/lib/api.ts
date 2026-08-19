import type { ModelTransparency, ScanResult } from './types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

function normalizeScan(scan: ScanResult): ScanResult {
  return {
    ...scan,
    heatmap_url: scan.heatmap_url.startsWith('http') ? scan.heatmap_url : `${API_BASE}${scan.heatmap_url}`,
  };
}

export async function predictMedia(file: File, sessionId: string): Promise<ScanResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'X-Session-Id': sessionId,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Prediction failed with status ${response.status}`);
  }

  return normalizeScan((await response.json()) as ScanResult);
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
