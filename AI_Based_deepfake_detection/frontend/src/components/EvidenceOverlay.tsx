interface EvidenceOverlayProps {
  previewUrl?: string;
  heatmapUrl?: string;
  verdict: 'real' | 'fake';
  confidence: number;
}

export function EvidenceOverlay({ previewUrl, heatmapUrl, verdict, confidence }: EvidenceOverlayProps) {
  const percentage = Math.round(confidence * 100);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
        <div>
          <p className="panel-title">Evidence overlay</p>
          <p className="mt-1 text-sm text-muted">Face crop with forensic heatmap and verdict annotation.</p>
        </div>
        <div className={[
          'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]',
          verdict === 'fake' ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        ].join(' ')}>
          {verdict} · {percentage}%
        </div>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-surfaceAlt">
        {previewUrl ? (
          <img src={previewUrl} alt="Uploaded media preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_42%),linear-gradient(135deg,rgba(6,9,18,1),rgba(17,24,39,1))]">
            <div className="rounded-full border border-white/15 px-6 py-4 text-sm text-white/70">Waiting for frame preview</div>
          </div>
        )}

        {heatmapUrl ? (
          <img
            src={heatmapUrl}
            alt="Evidence heatmap"
            className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_56%_52%,rgba(20,184,166,0.18),transparent_18%)]" />
        )}

        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-mono uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
          Model evidence
        </div>

        <div className="absolute right-4 top-4 rounded-2xl border border-white/15 bg-black/45 px-3 py-2 text-right text-white/90 backdrop-blur-md">
          <div className="mono-label text-white/55">Confidence</div>
          <div className="font-mono text-xl font-semibold">{percentage}%</div>
        </div>
      </div>
    </div>
  );
}
