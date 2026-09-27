import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LiveAnalysisPanels } from '../components/LiveAnalysisPanels';
import { useScan } from '../context/scan';
import { fetchPredictionStatus, startPrediction } from '../lib/api';
import type { PredictionStatus, ScanResult } from '../lib/types';

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
  const [status, setStatus] = useState<PredictionStatus | null>(null);

  const frameLabel = useMemo(() => `Analyzing frame ${Math.max(1, Math.round((progress / 100) * 300))} of 300`, [progress]);

  useEffect(() => {
    if (!uploadState) {
      navigate('/upload', { replace: true });
      return;
    }

    let cancelled = false;
    let scanId: string | null = null;

    const begin = async () => {
      try {
        const result = await startPrediction(uploadState.file, sessionId);
        scanId = result.id;
      } catch (error) {
        if (!cancelled) {
          navigate('/upload', { replace: true });
        }
      }
    };

    void begin();

    const poll = window.setInterval(async () => {
      if (!scanId || cancelled) {
        return;
      }

      try {
        const nextStatus = await fetchPredictionStatus(scanId);
        setStatus(nextStatus);
        setProgress(nextStatus.progress ?? 0);
        setActiveStageIndex(Math.min(stages.length - 1, Math.max(0, nextStatus.stage_index ?? 0)));
        setConfidence(nextStatus.result?.confidence ?? nextStatus.details?.latest_score ?? 0.12);
        if (Array.isArray(nextStatus.result?.per_frame_scores)) {
          setFrameScores(nextStatus.result.per_frame_scores.slice(0, 8).map((score) => Math.min(0.99, Math.max(0.05, score))));
        }

        if (nextStatus.status === 'complete' && nextStatus.result) {
          const finalResult: ScanResult = {
            ...nextStatus.result,
            preview_url: uploadState.previewUrl,
          };
          saveScan(finalResult);
          setUploadState(null);
          window.clearInterval(poll);
          navigate('/results', { replace: true });
        }
      } catch {
        // continue polling; backend may still be initializing
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
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
        pipelineLog={status?.stage ? [status.stage, ...stages.filter((item) => item !== status.stage)] : stages}
      />
    </section>
  );
}
