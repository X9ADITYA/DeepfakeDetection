import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchHistory, fetchModelTransparency } from '../lib/api';
import { addLocalHistory, loadLocalHistory } from '../lib/history';
import { getSessionId } from '../lib/session';
import type { ModelTransparency, ScanResult, UploadState } from '../lib/types';

interface ScanContextValue {
  sessionId: string;
  uploadState: UploadState | null;
  currentScan: ScanResult | null;
  history: ScanResult[];
  modelTransparency: ModelTransparency | null;
  setUploadState: (state: UploadState | null) => void;
  setCurrentScan: (scan: ScanResult | null) => void;
  saveScan: (scan: ScanResult) => void;
  refreshHistory: () => Promise<void>;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => getSessionId());
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>(() => loadLocalHistory());
  const [modelTransparency, setModelTransparency] = useState<ModelTransparency | null>(null);

  useEffect(() => {
    void refreshHistory();
    void fetchModelTransparency().then(setModelTransparency).catch(() => setModelTransparency(null));
  }, [sessionId]);

  async function refreshHistory() {
    try {
      const remoteHistory = await fetchHistory(sessionId);
      const merged = [...remoteHistory, ...loadLocalHistory()].filter((entry, index, array) => array.findIndex((candidate) => candidate.id === entry.id) === index);
      setHistory(merged);
    } catch {
      setHistory(loadLocalHistory());
    }
  }

  function saveScan(scan: ScanResult) {
    const next = addLocalHistory(scan);
    setHistory(next);
    setCurrentScan(scan);
  }

  const value = useMemo<ScanContextValue>(() => ({
    sessionId,
    uploadState,
    currentScan,
    history,
    modelTransparency,
    setUploadState,
    setCurrentScan,
    saveScan,
    refreshHistory,
  }), [currentScan, history, modelTransparency, sessionId, uploadState]);

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used inside ScanProvider');
  }
  return context;
}
