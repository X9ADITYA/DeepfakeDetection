import type { ScanResult } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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

  return response.json() as Promise<ScanResult>;
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

  return response.json() as Promise<ScanResult[]>;
}
