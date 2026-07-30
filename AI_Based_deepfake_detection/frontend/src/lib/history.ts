import type { ScanResult } from './types';

const HISTORY_KEY = 'deepfake-scan-history';

export function loadLocalHistory(): ScanResult[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ScanResult[];
  } catch {
    return [];
  }
}

export function saveLocalHistory(entries: ScanResult[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function addLocalHistory(entry: ScanResult): ScanResult[] {
  const current = loadLocalHistory();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)];
  saveLocalHistory(next);
  return next;
}
