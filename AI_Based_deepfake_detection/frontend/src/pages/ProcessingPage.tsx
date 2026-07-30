import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LiveAnalysisPanels } from '../components/LiveAnalysisPanels';
import { useScan } from '../context/scan';
import { predictMedia } from '../lib/api';
import { buildMockScan } from '../lib/mockScan';
import type { ScanResult } from '../lib/types';

const stages = [
  'Detecting faces...',
  'Extracting forensic features...',
  'Cross-referencing artifact patterns...',
  'Rendering evidence overlay...',
];

export function ProcessingPage() {
  const navigate = useNavigate();
  const { uploadState, sessionId, saveScan, setUploadState } = useScan();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [confidence, setConfidence] = useState(0.12);
  const [frameScores, setFrameScores] = useState([0.18, 0.24, 0.2, 0.28, 0.31, 0.34, 0.38, 0.42]);
  const [pipelineLog, setPipelineLog] = useState<string[]>(stages);

  const frameLabel = useMemo(() => `Analyzing frame ${Math.max(1, Math.round((progress / 100) * 300))} of 300`, [progress]);

  useEffect(() => {
    if (!uploadState) {
      navigate('/upload', { replace: true });
      return;
    }

    let cancelled = false;
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(98, current + 9));
      setConfidence((current) => Math.min(0.96, current + 0.06));
      setActiveStageIndex((current) => Math.min(stages.length - 1, current + (Math.random() > 0.7 ? 1 : 0)));
      setFrameScores((current) => current.map((score, index) => Math.min(0.99, score + 0.02 + index * 0.002)));
    }, 420);

    const finish = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      let result: ScanResult;
      try {
        result = await predictMedia(uploadState.file, sessionId);
      } catch {
        result = buildMockScan(uploadState.file, sessionId);
      }

      result = {
        ...result,
        preview_url: uploadState.previewUrl,
      };

      saveScan(result);
      setUploadState(null);
      window.clearInterval(interval);
      navigate('/results', { replace: true });
    }, 3200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(finish);
    };
  }, [navigate, saveScan, sessionId, setUploadState, uploadState]);

  if (!uploadState) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="glass-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="panel-title">Analyzing media</p>
          <h1 className="mt-2 text-2xl text-text sm:text-3xl">The scan is live and updating in place.</h1>
        </div>
        <div className="font-mono text-sm uppercase tracking-[0.24em] text-muted">{frameLabel}</div>
      </div>

      <LiveAnalysisPanels
        scanPreviewUrl={uploadState.previewUrl}
        stages={stages}
        activeStageIndex={activeStageIndex}
        progress={progress}
        confidence={confidence}
        frameScores={frameScores}
        pipelineLog={pipelineLog}
      />
    </section>
  );
}
