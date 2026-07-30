import { motion, useReducedMotion } from 'framer-motion';

import type { ScanResult } from '../lib/types';
import { ConfidenceRing } from './ConfidenceRing';

interface LiveAnalysisPanelsProps {
  scanPreviewUrl?: string;
  stages: string[];
  activeStageIndex: number;
  progress: number;
  confidence: number;
  frameScores: number[];
  pipelineLog: string[];
}

export function LiveAnalysisPanels({
  scanPreviewUrl,
  stages,
  activeStageIndex,
  progress,
  confidence,
  frameScores,
  pipelineLog,
}: LiveAnalysisPanelsProps) {
  const shouldReduceMotion = useReducedMotion();
  const activeStage = stages[Math.min(activeStageIndex, stages.length - 1)] ?? 'Scanning';

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/70 px-4 py-3 sm:px-5">
          <p className="panel-title">Live frame</p>
          <p className="mt-1 text-sm text-muted">{activeStage}</p>
        </div>

        <div className="relative aspect-video overflow-hidden bg-surfaceAlt">
          {scanPreviewUrl ? (
            <img src={scanPreviewUrl} alt="Current analysis frame" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_35%),linear-gradient(135deg,rgba(6,9,18,1),rgba(18,27,45,1))]" />
          )}

          <motion.div
            className="absolute left-[18%] top-[17%] rounded-[1.35rem] border-2 border-glowBlue bg-glowBlue/5"
            animate={shouldReduceMotion ? undefined : { x: [0, 6, 0], y: [0, -2, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '44%', height: '42%' }}
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />

          <div className="absolute left-4 bottom-4 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-white/90 backdrop-blur-md">
            <div className="mono-label text-white/60">Frame progress</div>
            <div className="mt-1 text-2xl font-semibold">{Math.max(1, Math.round(progress))}%</div>
          </div>

          <div className="absolute right-4 bottom-4 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-white/90 backdrop-blur-md">
            <div className="mono-label text-white/60">Live confidence</div>
            <div className="mt-1 font-mono text-2xl font-semibold">{Math.round(confidence * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <ConfidenceRing confidence={confidence} label="live score" />

        <div className="glass-card px-4 py-4 sm:px-5">
          <p className="panel-title">Frame scan strip</p>
          <div className="mt-4 flex items-end gap-2">
            {frameScores.map((score, index) => (
              <div key={`${index}-${score}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full overflow-hidden rounded-full bg-surfaceAlt">
                  <motion.div
                    className="rounded-full bg-gradient-to-t from-glowBlue via-accent to-glowTeal"
                    initial={false}
                    animate={{ height: `${Math.max(12, Math.min(100, score * 100))}%` }}
                    transition={{ duration: 0.45 }}
                    style={{ minHeight: 12 }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card px-4 py-4 sm:px-5">
          <p className="panel-title">Pipeline log</p>
          <div className="mt-4 space-y-3 text-sm">
            {pipelineLog.map((entry, index) => {
              const isActive = index === Math.min(activeStageIndex, pipelineLog.length - 1);
              const isDone = index < activeStageIndex;
              return (
                <div key={entry} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surfaceAlt px-3 py-3">
                  <span
                    className={[
                      'mt-0.5 inline-flex h-2.5 w-2.5 rounded-full',
                      isDone ? 'bg-emerald-400' : isActive ? 'bg-accent' : 'bg-border',
                    ].join(' ')}
                  />
                  <div>
                    <p className="font-medium text-text">{entry}</p>
                    <p className="mt-1 text-xs text-muted">{isDone ? 'Complete' : isActive ? 'Running now' : 'Queued'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
