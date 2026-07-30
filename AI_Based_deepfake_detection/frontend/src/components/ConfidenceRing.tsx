interface ConfidenceRingProps {
  confidence: number;
  label?: string;
}

export function ConfidenceRing({ confidence, label = 'confidence' }: ConfidenceRingProps) {
  const safeConfidence = Math.min(0.99, Math.max(0.01, confidence));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - safeConfidence * circumference;
  const percentage = Math.round(safeConfidence * 100);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-surfaceAlt" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-accent transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold tracking-tight text-text">{percentage}%</span>
          <span className="mono-label mt-1">{label}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="panel-title">Verdict probability</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          The score updates as each frame is checked. The final verdict is based on the model confidence crossing the detection threshold.
        </p>
      </div>
    </div>
  );
}
